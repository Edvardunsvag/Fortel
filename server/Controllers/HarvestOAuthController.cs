using Fortedle.Server.Helpers;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Models.Database;
using Fortedle.Server.Repositories;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/harvest-oauth")]
[Authorize]

public class HarvestOAuthController : ControllerBase
{
    private readonly HarvestApiService _harvestApiService;
    private readonly IHarvestTokenRepository _harvestTokenRepository;
    private readonly ILogger<HarvestOAuthController> _logger;

    public HarvestOAuthController(
        HarvestApiService harvestApiService,
        IHarvestTokenRepository harvestTokenRepository,
        ILogger<HarvestOAuthController> logger)
    {
        _harvestApiService = harvestApiService;
        _harvestTokenRepository = harvestTokenRepository;
        _logger = logger;
    }

    /// <summary>
    /// Exchange authorization code for access token
    /// </summary>
    [HttpPost("exchange")]
    public async Task<ActionResult<ExchangeTokenResponse>> ExchangeToken([FromBody] ExchangeTokenRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { error = "code is required" });
            }

            if (string.IsNullOrWhiteSpace(request.State))
            {
                return BadRequest(new { error = "state is required" });
            }

            // Note: Full state validation for CSRF protection is performed on the frontend
            // where the state is generated and stored. This backend validation ensures
            // the state parameter is present and not empty as an additional security layer.
            _logger.LogInformation("Exchanging authorization code for token (state validated on frontend)");

            // Extract user email from JWT token
            var userEmail = UserClaimsHelper.GetUserEmail(User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Unable to extract user email from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            var tokenResponse = await _harvestApiService.ExchangeCodeForTokenAsync(request.Code);

            // Fetch account ID from accounts endpoint (more reliable than extracting from token)
            var accountId = await _harvestApiService.GetAccountIdFromAccountsEndpointAsync(tokenResponse.AccessToken);
            
            // Fallback to account ID from response or extracted from token
            if (string.IsNullOrEmpty(accountId))
            {
                accountId = tokenResponse.AccountId ?? string.Empty;
                _logger.LogWarning("Using account ID from token response/extraction for user {UserEmail}: {AccountId}", userEmail, accountId);
            }
            else
            {
                _logger.LogInformation("Fetched account ID from accounts endpoint for user {UserEmail}: {AccountId}", userEmail, accountId);
            }

            // Store tokens in database
            var harvestToken = new HarvestToken
            {
                UserId = userEmail,
                AccessToken = tokenResponse.AccessToken,
                RefreshToken = tokenResponse.RefreshToken,
                ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn),
                AccountId = accountId,
            };

            await _harvestTokenRepository.UpsertAsync(harvestToken);
            _logger.LogInformation("Successfully stored Harvest token for user {UserEmail} with account {AccountId}", userEmail, accountId);

            // Return success response without tokens (security best practice)
            var response = new ExchangeTokenResponse
            {
                AccessToken = string.Empty, // Don't return tokens to frontend
                TokenType = tokenResponse.TokenType,
                ExpiresIn = tokenResponse.ExpiresIn,
                RefreshToken = string.Empty, // Don't return tokens to frontend
                AccountId = tokenResponse.AccountId,
            };

            _logger.LogInformation("Successfully exchanged authorization code for token");
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid request for token exchange");
            return BadRequest(new { error = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error during token exchange");
            return StatusCode(500, new { error = "Failed to exchange authorization code. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging authorization code for token");
            return StatusCode(500, new { error = "An unexpected error occurred during token exchange." });
        }
    }

    /// <summary>
    /// Get Harvest token status for the authenticated user
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<HarvestTokenStatusResponse>> GetTokenStatus()
    {
        try
        {
            var userEmail = UserClaimsHelper.GetUserEmail(User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Unable to extract user email from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            var token = await _harvestTokenRepository.GetByUserIdAsync(userEmail);
            
            if (token == null)
            {
                return Ok(new HarvestTokenStatusResponse
                {
                    IsAuthenticated = false,
                    AccountId = null,
                });
            }

            // Check if token is still valid (not expired)
            var isAuthenticated = DateTime.UtcNow < token.ExpiresAt.AddMinutes(-1); // 1 minute buffer

            return Ok(new HarvestTokenStatusResponse
            {
                IsAuthenticated = isAuthenticated,
                AccountId = token.AccountId,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Harvest token status");
            return StatusCode(500, new { error = "An unexpected error occurred while checking token status." });
        }
    }

    /// <summary>
    /// Revoke and delete Harvest tokens for the authenticated user
    /// </summary>
    [HttpDelete("revoke")]
    public async Task<ActionResult> RevokeToken()
    {
        try
        {
            var userEmail = UserClaimsHelper.GetUserEmail(User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Unable to extract user email from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            await _harvestTokenRepository.DeleteByUserIdAsync(userEmail);
            _logger.LogInformation("Successfully revoked Harvest token for user {UserEmail}", userEmail);

            return Ok(new { message = "Harvest token revoked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking Harvest token");
            return StatusCode(500, new { error = "An unexpected error occurred while revoking token." });
        }
    }

    /// <summary>
    /// Get the current Harvest user for the authenticated user
    /// Backend retrieves tokens from database automatically
    /// </summary>
    [HttpGet("user")]
    public async Task<ActionResult<HarvestUserResponse>> GetHarvestUser()
    {
        try
        {
            var userEmail = UserClaimsHelper.GetUserEmail(User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Unable to extract user email from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            _logger.LogInformation("GetHarvestUser called for user {UserEmail}", userEmail);
            
            // Get tokens from database (automatically refreshes if expired)
            var (accessToken, accountId) = await _harvestApiService.GetTokenForUserAsync(userEmail);
            _logger.LogInformation("Retrieved Harvest tokens for user {UserEmail} with account {AccountId}, token length: {TokenLength}", 
                userEmail, 
                accountId,
                accessToken?.Length ?? 0);

            // Fetch user from Harvest API
            _logger.LogDebug("Calling GetCurrentUserAsync with azureAdUserId: {AzureAdUserId}", userEmail);
            var harvestUser = await _harvestApiService.GetCurrentUserAsync(
                accessToken: null,
                refreshToken: null,
                tokenExpiresAt: null,
                accountId: null,
                azureAdUserId: userEmail);
            
            _logger.LogDebug("GetCurrentUserAsync returned {Result}", harvestUser != null ? $"user {harvestUser.Email}" : "null");

            if (harvestUser == null)
            {
                _logger.LogWarning("Harvest user not found for user {UserEmail}. Token may be invalid or user may not exist in Harvest.", userEmail);
                return NotFound(new { error = "Harvest user not found. Please try re-authenticating through OAuth." });
            }

            // Map to response DTO
            var response = new HarvestUserResponse
            {
                Id = harvestUser.Id,
                FirstName = harvestUser.FirstName,
                LastName = harvestUser.LastName,
                Email = harvestUser.Email,
                Timezone = harvestUser.Timezone,
                WeeklyCapacity = harvestUser.WeeklyCapacity,
                IsActive = harvestUser.IsActive,
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid request for Harvest user");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Harvest user");
            return StatusCode(500, new { error = "An unexpected error occurred while fetching Harvest user." });
        }
    }

    /// <summary>
    /// Get time entries for the authenticated user within a date range
    /// Backend retrieves tokens from database automatically
    /// </summary>
    [HttpGet("time-entries")]
    public async Task<ActionResult<HarvestTimeEntriesResponse>> GetTimeEntries([FromQuery] string from, [FromQuery] string to)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(from))
            {
                return BadRequest(new { error = "from parameter is required (YYYY-MM-DD)" });
            }

            if (string.IsNullOrWhiteSpace(to))
            {
                return BadRequest(new { error = "to parameter is required (YYYY-MM-DD)" });
            }

            var userEmail = UserClaimsHelper.GetUserEmail(User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Unable to extract user email from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            _logger.LogInformation("GetTimeEntries called for user {UserEmail}, from: {From}, to: {To}", userEmail, from, to);

            // Get tokens from database (automatically refreshes if expired)
            var (accessToken, accountId) = await _harvestApiService.GetTokenForUserAsync(userEmail);
            _logger.LogInformation("Retrieved Harvest tokens for time entries. AccountId: {AccountId}, token length: {TokenLength}", 
                accountId,
                accessToken?.Length ?? 0);

            // Get user ID first (needed for time entries query)
            _logger.LogDebug("Fetching Harvest user to get user ID");
            var harvestUser = await _harvestApiService.GetCurrentUserAsync(
                accessToken: null,
                refreshToken: null,
                tokenExpiresAt: null,
                accountId: null,
                azureAdUserId: userEmail);

            if (harvestUser == null)
            {
                _logger.LogWarning("Harvest user not found for user {UserEmail}", userEmail);
                return NotFound(new { error = "Harvest user not found" });
            }

            _logger.LogInformation("Found Harvest user {HarvestUserId} ({Email})", harvestUser.Id, harvestUser.Email);

            // Fetch time entries from Harvest API
            _logger.LogDebug("Fetching time entries for Harvest user {HarvestUserId} from {From} to {To}", 
                harvestUser.Id, 
                from, 
                to);
            var timeEntries = await _harvestApiService.GetTimeEntriesAsync(
                harvestUser.Id,
                from,
                to,
                accessToken: null,
                refreshToken: null,
                tokenExpiresAt: null,
                accountId: null,
                azureAdUserId: userEmail);
            
            _logger.LogInformation("Retrieved {Count} time entries for user {UserEmail}", timeEntries.Count, userEmail);

            // Map to response DTO
            var response = new HarvestTimeEntriesResponse
            {
                TimeEntries = timeEntries.Select(te => new HarvestTimeEntryResponse
                {
                    Id = te.Id,
                    SpentDate = te.SpentDate,
                    Hours = te.Hours,
                    CreatedAt = te.CreatedAt,
                    UpdatedAt = te.UpdatedAt,
                    Client = te.Client != null ? new HarvestClientResponse
                    {
                        Id = te.Client.Id,
                        Name = te.Client.Name,
                    } : null,
                }).ToList(),
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid request for time entries");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching time entries");
            return StatusCode(500, new { error = "An unexpected error occurred while fetching time entries." });
        }
    }
}

using Fortedle.Server.Models.DTOs;
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
    private readonly ILogger<HarvestOAuthController> _logger;

    public HarvestOAuthController(
        HarvestApiService harvestApiService,
        ILogger<HarvestOAuthController> logger)
    {
        _harvestApiService = harvestApiService;
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

            var tokenResponse = await _harvestApiService.ExchangeCodeForTokenAsync(request.Code);

            var response = new ExchangeTokenResponse
            {
                AccessToken = tokenResponse.AccessToken,
                TokenType = tokenResponse.TokenType,
                ExpiresIn = tokenResponse.ExpiresIn,
                RefreshToken = tokenResponse.RefreshToken,
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
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshTokenResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new { error = "refreshToken is required" });
            }

            _logger.LogInformation("Refreshing access token");

            var tokenResponse = await _harvestApiService.RefreshAccessTokenAsync(request.RefreshToken);

            var response = new RefreshTokenResponse
            {
                AccessToken = tokenResponse.AccessToken,
                TokenType = tokenResponse.TokenType,
                ExpiresIn = tokenResponse.ExpiresIn,
                RefreshToken = tokenResponse.RefreshToken,
                AccountId = tokenResponse.AccountId,
            };

            _logger.LogInformation("Successfully refreshed access token");
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid request for token refresh");
            return BadRequest(new { error = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error during token refresh");
            return StatusCode(500, new { error = "Failed to refresh token. Please re-authenticate." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing access token");
            return StatusCode(500, new { error = "An unexpected error occurred during token refresh." });
        }
    }
}

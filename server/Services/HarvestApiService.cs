using Fortedle.Server.Models.Application.Harvest;
using Fortedle.Server.Services.Harvest;

namespace Fortedle.Server.Services;

/// <summary>
/// Facade service that coordinates Harvest OAuth, token management, and API operations.
/// Maintains backward compatibility with existing code.
/// </summary>
public class HarvestApiService
{
    private readonly IHarvestOAuthService _oauthService;
    private readonly IHarvestTokenManager _tokenManager;
    private readonly IHarvestApiClient _apiClient;
    private readonly ILogger<HarvestApiService> _logger;

    public HarvestApiService(
        IHarvestOAuthService oauthService,
        IHarvestTokenManager tokenManager,
        IHarvestApiClient apiClient,
        ILogger<HarvestApiService> logger)
    {
        _oauthService = oauthService;
        _tokenManager = tokenManager;
        _apiClient = apiClient;
        _logger = logger;
    }

    // Backward compatibility: Keep TokenResponse as nested class for existing code
    public class TokenResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public string? AccountId { get; set; }
    }

    // Backward compatibility: Keep nested classes for existing code
    public class HarvestTimeEntry
    {
        public long Id { get; set; }
        public string SpentDate { get; set; } = string.Empty;
        public double Hours { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public HarvestClient? Client { get; set; }
    }

    public class HarvestClient
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class HarvestUser
    {
        public long Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Timezone { get; set; } = string.Empty;
        public int WeeklyCapacity { get; set; }
        public bool IsActive { get; set; }
    }

    /// <summary>
    /// Exchange authorization code for access token
    /// </summary>
    public async Task<TokenResponse> ExchangeCodeForTokenAsync(string code)
    {
        var response = await _oauthService.ExchangeCodeForTokenAsync(code);
        return new TokenResponse
        {
            AccessToken = response.AccessToken,
            TokenType = response.TokenType,
            ExpiresIn = response.ExpiresIn,
            RefreshToken = response.RefreshToken,
            AccountId = response.AccountId
        };
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    public async Task<TokenResponse> RefreshAccessTokenAsync(string refreshToken)
    {
        var response = await _oauthService.RefreshAccessTokenAsync(refreshToken);
        return new TokenResponse
        {
            AccessToken = response.AccessToken,
            TokenType = response.TokenType,
            ExpiresIn = response.ExpiresIn,
            RefreshToken = response.RefreshToken,
            AccountId = response.AccountId
        };
    }

    /// <summary>
    /// Fetches the list of accounts available for the access token
    /// </summary>
    public async Task<string?> GetAccountIdFromAccountsEndpointAsync(string accessToken)
    {
        return await _apiClient.GetAccountIdFromAccountsEndpointAsync(accessToken);
    }

    /// <summary>
    /// Gets a valid access token, refreshing if needed
    /// </summary>
    public async Task<(string AccessToken, string AccountId)> GetValidTokenAsync(
        string? accessToken,
        string? refreshToken,
        DateTime? tokenExpiresAt,
        string? accountId)
    {
        return await _tokenManager.GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);
    }

    /// <summary>
    /// Gets tokens from database for a user, refreshing if expired
    /// </summary>
    public async Task<(string AccessToken, string AccountId)> GetTokenForUserAsync(string azureAdUserId)
    {
        return await _tokenManager.GetTokenForUserAsync(azureAdUserId);
    }

    /// <summary>
    /// Fetches time entries for a user from Harvest API
    /// Automatically refreshes token on 401 errors if azureAdUserId is provided
    /// </summary>
    public async Task<List<HarvestTimeEntry>> GetTimeEntriesAsync(
        long userId,
        string from,
        string to,
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null,
        string? azureAdUserId = null)
    {
        var entries = await _apiClient.GetTimeEntriesAsync(
            userId,
            from,
            to,
            accessToken,
            refreshToken,
            tokenExpiresAt,
            accountId,
            azureAdUserId);

        // Map to backward-compatible nested class
        return entries.Select(e => new HarvestTimeEntry
        {
            Id = e.Id,
            SpentDate = e.SpentDate,
            Hours = e.Hours,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            Client = e.Client != null ? new HarvestClient
            {
                Id = e.Client.Id,
                Name = e.Client.Name
            } : null
        }).ToList();
    }

    /// <summary>
    /// Fetches the current user from Harvest API (/users/me)
    /// Automatically refreshes token on 401 errors if azureAdUserId is provided
    /// </summary>
    public async Task<HarvestUser?> GetCurrentUserAsync(
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null,
        string? azureAdUserId = null)
    {
        var user = await _apiClient.GetCurrentUserAsync(
            accessToken,
            refreshToken,
            tokenExpiresAt,
            accountId,
            azureAdUserId);

        if (user == null)
        {
            return null;
        }

        // Map to backward-compatible nested class
        return new HarvestUser
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Timezone = user.Timezone,
            WeeklyCapacity = user.WeeklyCapacity,
            IsActive = user.IsActive
        };
    }

    /// <summary>
    /// Fetches a user by ID from Harvest API
    /// </summary>
    public async Task<HarvestUser?> GetUserByIdAsync(
        long userId,
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null)
    {
        var user = await _apiClient.GetUserByIdAsync(
            userId,
            accessToken,
            refreshToken,
            tokenExpiresAt,
            accountId);

        if (user == null)
        {
            return null;
        }

        // Map to backward-compatible nested class
        return new HarvestUser
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Timezone = user.Timezone,
            WeeklyCapacity = user.WeeklyCapacity,
            IsActive = user.IsActive
        };
    }
}

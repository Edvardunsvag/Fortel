using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Fortedle.Server.Services;

public class HarvestApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HarvestApiService> _logger;
    private readonly IConfiguration _configuration;

    public HarvestApiService(
        HttpClient httpClient,
        ILogger<HarvestApiService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
    }

    public class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("account_id")]
        public string? AccountId { get; set; }
    }

    /// <summary>
    /// Extract account ID from Harvest access token
    /// Harvest tokens are in format: {account_id}.at.{token}
    /// </summary>
    private string ExtractAccountIdFromToken(string accessToken)
    {
        var parts = accessToken.Split('.');
        if (parts.Length >= 2 && !string.IsNullOrEmpty(parts[0]))
        {
            return parts[0];
        }
        throw new InvalidOperationException("Unable to extract account ID from access token");
    }

    /// <summary>
    /// Exchange authorization code for access token
    /// </summary>
    public async Task<TokenResponse> ExchangeCodeForTokenAsync(string code)
    {
        var clientId = _configuration["Harvest:ClientId"];
        var clientSecret = _configuration["Harvest:ClientSecret"];
        var redirectUri = _configuration["Harvest:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Harvest ClientId and ClientSecret must be configured in appsettings.json");
        }

        var tokenEndpoint = "https://id.getharvest.com/api/v2/oauth2/token";
        var requestBody = new List<KeyValuePair<string, string>>
        {
            new("client_id", clientId),
            new("client_secret", clientSecret),
            new("code", code),
            new("grant_type", "authorization_code"),
            new("redirect_uri", redirectUri ?? "http://localhost:5173/time-lottery")
        };

        var request = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint)
        {
            Content = new FormUrlEncodedContent(requestBody)
        };
        request.Headers.Add("User-Agent", "Fortedle App");

        try
        {
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<TokenResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (tokenData == null)
            {
                throw new InvalidOperationException("Failed to deserialize token response");
            }

            // Extract account_id from the access token if not provided in response
            if (string.IsNullOrEmpty(tokenData.AccountId) && !string.IsNullOrEmpty(tokenData.AccessToken))
            {
                tokenData.AccountId = ExtractAccountIdFromToken(tokenData.AccessToken);
            }

            return tokenData;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to exchange code for token");
            throw;
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    public async Task<TokenResponse> RefreshAccessTokenAsync(string refreshToken)
    {
        var clientId = _configuration["Harvest:ClientId"];
        var clientSecret = _configuration["Harvest:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Harvest ClientId and ClientSecret must be configured in appsettings.json");
        }

        var tokenEndpoint = "https://id.getharvest.com/api/v2/oauth2/token";
        var requestBody = new List<KeyValuePair<string, string>>
        {
            new("client_id", clientId),
            new("client_secret", clientSecret),
            new("refresh_token", refreshToken),
            new("grant_type", "refresh_token")
        };

        var request = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint)
        {
            Content = new FormUrlEncodedContent(requestBody)
        };
        request.Headers.Add("User-Agent", "Fortedle App");

        try
        {
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<TokenResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (tokenData == null)
            {
                throw new InvalidOperationException("Failed to deserialize token response");
            }

            // Extract account_id from the access token if not provided in response
            if (string.IsNullOrEmpty(tokenData.AccountId) && !string.IsNullOrEmpty(tokenData.AccessToken))
            {
                tokenData.AccountId = ExtractAccountIdFromToken(tokenData.AccessToken);
            }

            return tokenData;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to refresh access token");
            throw;
        }
    }

    public class HarvestTimeEntry
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("spent_date")]
        public string SpentDate { get; set; } = string.Empty;

        [JsonPropertyName("hours")]
        public double Hours { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }

    public class HarvestTimeEntriesResponse
    {
        [JsonPropertyName("time_entries")]
        public List<HarvestTimeEntry> TimeEntries { get; set; } = new();
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
        // If token is provided and not expired, use it
        if (!string.IsNullOrEmpty(accessToken) && 
            tokenExpiresAt.HasValue && 
            tokenExpiresAt.Value > DateTime.UtcNow.AddMinutes(1))
        {
            return (accessToken, accountId ?? string.Empty);
        }

        // Try to refresh if we have a refresh token
        if (!string.IsNullOrEmpty(refreshToken))
        {
            try
            {
                var tokenResponse = await RefreshAccessTokenAsync(refreshToken);
                return (tokenResponse.AccessToken, tokenResponse.AccountId ?? string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh token, will try configuration fallback");
            }
        }

        // Fallback to configuration
        var configToken = _configuration["Harvest:AccessToken"];
        var configAccount = _configuration["Harvest:AccountId"];

        if (string.IsNullOrEmpty(configToken))
        {
            throw new InvalidOperationException(
                "Harvest access token is required but not configured. " +
                "Please authenticate through OAuth or add 'Harvest:AccessToken' and 'Harvest:AccountId' to appsettings.json.");
        }

        return (configToken, configAccount ?? string.Empty);
    }

    /// <summary>
    /// Fetches time entries for a user from Harvest API
    /// </summary>
    public async Task<List<HarvestTimeEntry>> GetTimeEntriesAsync(
        int userId,
        string from,
        string to,
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null)
    {
        // Get valid token (refresh if needed)
        var (token, account) = await GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);

        if (string.IsNullOrEmpty(token))
        {
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = $"https://api.harvestapp.com/v2/time_entries?user_id={userId}&from={from}&to={to}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Headers.Add("User-Agent", "Fortedle App");

        if (!string.IsNullOrEmpty(account))
        {
            request.Headers.Add("Harvest-Account-ID", account);
        }

        try
        {
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<HarvestTimeEntriesResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result?.TimeEntries ?? new List<HarvestTimeEntry>();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to fetch time entries from Harvest API for user {UserId}", userId);
            throw;
        }
    }
}

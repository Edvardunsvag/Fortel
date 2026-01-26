using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public class HarvestApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HarvestApiService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHarvestTokenRepository _harvestTokenRepository;

    public HarvestApiService(
        HttpClient httpClient,
        ILogger<HarvestApiService> logger,
        IConfiguration configuration,
        IHarvestTokenRepository harvestTokenRepository)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        _harvestTokenRepository = harvestTokenRepository;
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
        if (string.IsNullOrEmpty(accessToken))
        {
            _logger.LogError("Attempted to extract account ID from null or empty access token");
            throw new InvalidOperationException("Access token is null or empty");
        }

        var parts = accessToken.Split('.');
        _logger.LogDebug("Extracting account ID from token. Token length: {TokenLength}, Parts count: {PartsCount}", 
            accessToken.Length, 
            parts.Length);
        
        if (parts.Length >= 2 && !string.IsNullOrEmpty(parts[0]))
        {
            var accountId = parts[0];
            _logger.LogInformation("Extracted account ID {AccountId} from access token", accountId);
            return accountId;
        }
        
        _logger.LogError("Unable to extract account ID from access token. Token length: {TokenLength}", 
            accessToken.Length);
        throw new InvalidOperationException("Unable to extract account ID from access token");
    }

    /// <summary>
    /// Exchange authorization code for access token
    /// </summary>
    public async Task<TokenResponse> ExchangeCodeForTokenAsync(string code)
    {
        // Try environment variables first, then fall back to configuration
        var clientId = _configuration["HARVEST_CLIENT_ID"] 
                      ?? _configuration["Harvest:ClientId"];
        var clientSecret = _configuration["HARVEST_CLIENT_SECRET"] 
                          ?? _configuration["Harvest:ClientSecret"];
        var redirectUri = _configuration["HARVEST_REDIRECT_URI"] 
                         ?? _configuration["Harvest:RedirectUri"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Harvest ClientId and ClientSecret must be configured in appsettings.json or environment variables (HARVEST_CLIENT_ID, HARVEST_CLIENT_SECRET)");
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
        // Try environment variables first, then fall back to configuration
        var clientId = _configuration["HARVEST_CLIENT_ID"] 
                      ?? _configuration["Harvest:ClientId"];
        var clientSecret = _configuration["HARVEST_CLIENT_SECRET"] 
                          ?? _configuration["Harvest:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Harvest ClientId and ClientSecret must be configured in appsettings.json or environment variables (HARVEST_CLIENT_ID, HARVEST_CLIENT_SECRET)");
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
            _logger.LogDebug("Token refresh response JSON: {Json}", json);
            
            var tokenData = JsonSerializer.Deserialize<TokenResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (tokenData == null)
            {
                throw new InvalidOperationException("Failed to deserialize token response");
            }

            _logger.LogDebug("Token refresh response parsed - AccessToken length: {TokenLength}, AccountId from response: {ResponseAccountId}, ExpiresIn: {ExpiresIn}", 
                tokenData.AccessToken?.Length ?? 0,
                tokenData.AccountId ?? "null",
                tokenData.ExpiresIn);

            // Extract account_id from the access token if not provided in response
            if (string.IsNullOrEmpty(tokenData.AccountId) && !string.IsNullOrEmpty(tokenData.AccessToken))
            {
                _logger.LogDebug("AccountId not in response, extracting from access token");
                tokenData.AccountId = ExtractAccountIdFromToken(tokenData.AccessToken);
            }
            else if (!string.IsNullOrEmpty(tokenData.AccountId))
            {
                _logger.LogInformation("Using AccountId from token refresh response: {AccountId}", tokenData.AccountId);
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
        public long Id { get; set; }

        [JsonPropertyName("spent_date")]
        public string SpentDate { get; set; } = string.Empty;

        [JsonPropertyName("hours")]
        public double Hours { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        [JsonPropertyName("client")]
        public HarvestClient? Client { get; set; }
    }

    public class HarvestClient
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class HarvestTimeEntriesResponse
    {
        [JsonPropertyName("time_entries")]
        public List<HarvestTimeEntry> TimeEntries { get; set; } = new();
    }

    public class HarvestUser
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("first_name")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("last_name")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("timezone")]
        public string Timezone { get; set; } = string.Empty;

        [JsonPropertyName("weekly_capacity")]
        public int WeeklyCapacity { get; set; }

        [JsonPropertyName("is_active")]
        public bool IsActive { get; set; }
    }

    public class HarvestAccount
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("product")]
        public string Product { get; set; } = string.Empty;
    }

    public class HarvestAccountsResponse
    {
        [JsonPropertyName("user")]
        public HarvestUser? User { get; set; }

        [JsonPropertyName("accounts")]
        public List<HarvestAccount> Accounts { get; set; } = new();
    }

    /// <summary>
    /// Fetches the list of accounts available for the access token
    /// </summary>
    public async Task<string?> GetAccountIdFromAccountsEndpointAsync(string accessToken)
    {
        try
        {
            var url = "https://id.getharvest.com/api/v2/accounts";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Bearer {accessToken}");
            request.Headers.Add("User-Agent", "Fortedle App");

            _logger.LogDebug("Fetching accounts from Harvest ID endpoint to get account ID");

            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to fetch accounts from Harvest ID. Status: {StatusCode}, Response: {ErrorContent}", 
                    response.StatusCode, 
                    errorContent);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("Accounts endpoint response: {Json}", json);
            
            var accountsData = JsonSerializer.Deserialize<HarvestAccountsResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (accountsData == null || accountsData.Accounts == null || accountsData.Accounts.Count == 0)
            {
                _logger.LogWarning("No accounts found in accounts endpoint response");
                return null;
            }

            // Find the first Harvest account (not Forecast)
            var harvestAccount = accountsData.Accounts.FirstOrDefault(a => 
                a.Product.Equals("harvest", StringComparison.OrdinalIgnoreCase));

            if (harvestAccount != null)
            {
                var accountId = harvestAccount.Id.ToString();
                _logger.LogInformation("Found Harvest account ID {AccountId} from accounts endpoint (account name: {AccountName})", 
                    accountId, 
                    harvestAccount.Name);
                return accountId;
            }

            // If no Harvest account, use the first account
            var firstAccount = accountsData.Accounts.First();
            var firstAccountId = firstAccount.Id.ToString();
            _logger.LogWarning("No Harvest account found, using first account ID {AccountId} (product: {Product})", 
                firstAccountId, 
                firstAccount.Product);
            return firstAccountId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching accounts from Harvest ID endpoint");
            return null;
        }
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
    /// Gets tokens from database for a user, refreshing if expired
    /// </summary>
    public async Task<(string AccessToken, string AccountId)> GetTokenForUserAsync(string azureAdUserId)
    {
        var token = await _harvestTokenRepository.GetByUserIdAsync(azureAdUserId);
        
        if (token == null)
        {
            throw new InvalidOperationException(
                $"No Harvest token found for user {azureAdUserId}. Please authenticate through OAuth first.");
        }

        // Check if token is expired or about to expire (within 1 minute)
        var needsRefresh = DateTime.UtcNow >= token.ExpiresAt.AddMinutes(-1);

        if (needsRefresh && !string.IsNullOrEmpty(token.RefreshToken))
        {
            try
            {
                _logger.LogInformation("Refreshing expired Harvest token for user {AzureAdUserId}", azureAdUserId);
                _logger.LogDebug("Current token state - AccountId: {CurrentAccountId}, ExpiresAt: {ExpiresAt}", 
                    token.AccountId, 
                    token.ExpiresAt);
                
                var tokenResponse = await RefreshAccessTokenAsync(token.RefreshToken);
                
                _logger.LogDebug("Token refresh response - ExpiresIn: {ExpiresIn}, AccountId from response: {ResponseAccountId}", 
                    tokenResponse.ExpiresIn,
                    tokenResponse.AccountId ?? "null");
                
                // Fetch account ID from the accounts endpoint (more reliable than extracting from token)
                var accountId = await GetAccountIdFromAccountsEndpointAsync(tokenResponse.AccessToken ?? string.Empty);
                
                // Fallback to extracting from token if accounts endpoint fails
                if (string.IsNullOrEmpty(accountId))
                {
                    _logger.LogWarning("Failed to get account ID from accounts endpoint, falling back to token extraction");
                    accountId = ExtractAccountIdFromToken(tokenResponse.AccessToken);
                }
                
                _logger.LogInformation("Using account ID {AccountId} for user {AzureAdUserId} (previous was {PreviousAccountId})", 
                    accountId, 
                    azureAdUserId,
                    token.AccountId);
                
                // Update token in database
                token.AccessToken = tokenResponse.AccessToken;
                token.RefreshToken = tokenResponse.RefreshToken;
                token.ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
                token.AccountId = accountId;
                
                await _harvestTokenRepository.UpsertAsync(token);
                _logger.LogInformation("Successfully refreshed Harvest token for user {AzureAdUserId}. New AccountId: {AccountId}, ExpiresAt: {ExpiresAt}", 
                    azureAdUserId,
                    accountId,
                    token.ExpiresAt);
                
                // Return the account ID from accounts endpoint
                return (tokenResponse.AccessToken, accountId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh Harvest token for user {AzureAdUserId}", azureAdUserId);
                throw new InvalidOperationException(
                    $"Failed to refresh Harvest token for user {azureAdUserId}. Please re-authenticate through OAuth.");
            }
        }

        return (token.AccessToken, token.AccountId ?? string.Empty);
    }

    /// <summary>
    /// Forces a token refresh for a user (used when we get 401 errors)
    /// </summary>
    private async Task<(string AccessToken, string AccountId)> ForceRefreshTokenForUserAsync(string azureAdUserId)
    {
        var token = await _harvestTokenRepository.GetByUserIdAsync(azureAdUserId);
        
        if (token == null)
        {
            throw new InvalidOperationException(
                $"No Harvest token found for user {azureAdUserId}. Please authenticate through OAuth first.");
        }

        if (string.IsNullOrEmpty(token.RefreshToken))
        {
            throw new InvalidOperationException(
                $"No refresh token found for user {azureAdUserId}. Please re-authenticate through OAuth.");
        }

        try
        {
            _logger.LogInformation("Force refreshing Harvest token for user {AzureAdUserId} after 401 error", azureAdUserId);
            _logger.LogDebug("Current token state - AccountId: {CurrentAccountId}, ExpiresAt: {ExpiresAt}, Token length: {TokenLength}", 
                token.AccountId, 
                token.ExpiresAt,
                token.AccessToken?.Length ?? 0);
            
            var tokenResponse = await RefreshAccessTokenAsync(token.RefreshToken);
            
            _logger.LogDebug("Token refresh response received - ExpiresIn: {ExpiresIn}, AccountId from response: {ResponseAccountId}, Token length: {TokenLength}",
                tokenResponse.ExpiresIn,
                tokenResponse.AccountId ?? "null",
                tokenResponse.AccessToken?.Length ?? 0);
            
            // Fetch account ID from the accounts endpoint (more reliable than extracting from token)
            var accountId = await GetAccountIdFromAccountsEndpointAsync(tokenResponse.AccessToken);
            
            // Fallback to extracting from token if accounts endpoint fails
            if (string.IsNullOrEmpty(accountId))
            {
                _logger.LogWarning("Failed to get account ID from accounts endpoint, falling back to token extraction");
                accountId = ExtractAccountIdFromToken(tokenResponse.AccessToken);
            }
            
            _logger.LogInformation("Using account ID {AccountId} for user {AzureAdUserId} (previous was {PreviousAccountId})", 
                accountId, 
                azureAdUserId,
                token.AccountId);
            
            // Update token in database
            token.AccessToken = tokenResponse.AccessToken;
            token.RefreshToken = tokenResponse.RefreshToken;
            token.ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
            token.AccountId = accountId;
            
            await _harvestTokenRepository.UpsertAsync(token);
            _logger.LogInformation("Successfully force refreshed Harvest token for user {AzureAdUserId}. New AccountId: {AccountId}, ExpiresAt: {ExpiresAt}", 
                azureAdUserId, 
                accountId,
                token.ExpiresAt);
            
            // Return the account ID from accounts endpoint
            return (tokenResponse.AccessToken, accountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to force refresh Harvest token for user {AzureAdUserId}", azureAdUserId);
            throw new InvalidOperationException(
                $"Failed to refresh Harvest token for user {azureAdUserId}. Please re-authenticate through OAuth.",
                ex);
        }
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
        string token;
        string account;
        bool shouldRetryOn401 = !string.IsNullOrEmpty(azureAdUserId);

        // If azureAdUserId is provided, get tokens from database
        if (!string.IsNullOrEmpty(azureAdUserId))
        {
            (token, account) = await GetTokenForUserAsync(azureAdUserId);
            _logger.LogDebug("Retrieved tokens from database for time entries. UserId: {UserId}, AccountId: {AccountId}", 
                userId, 
                account);
        }
        else
        {
            // Otherwise, use provided tokens or fallback to configuration
            (token, account) = await GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);
            _logger.LogDebug("Using provided tokens or configuration for time entries. AccountId: {AccountId}", account);
        }

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogError("Unable to obtain valid access token for GetTimeEntriesAsync");
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = $"https://api.harvestapp.com/v2/time_entries?user_id={userId}&from={from}&to={to}";

        // First attempt
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Headers.Add("User-Agent", "Fortedle App");

        if (!string.IsNullOrEmpty(account))
        {
            request.Headers.Add("Harvest-Account-Id", account);
            _logger.LogDebug("Making Harvest API request to {Url} with AccountId: {AccountId}", url, account);
        }
        else
        {
            _logger.LogWarning("Making Harvest API request to {Url} WITHOUT AccountId header", url);
        }

        try
        {
            var response = await _httpClient.SendAsync(request);
            
            // Handle 401 Unauthorized - try to refresh token if we have azureAdUserId
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized && shouldRetryOn401)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Harvest API returned 401 Unauthorized when fetching time entries. Attempting to refresh token. Response: {ErrorContent}",
                    errorContent);

                // Try to refresh the token and retry
                try
                {
                    if (string.IsNullOrEmpty(azureAdUserId))
                    {
                        throw new InvalidOperationException("Cannot refresh token: azureAdUserId is required");
                    }
                    _logger.LogInformation("Refreshing token for user {AzureAdUserId} before retry", azureAdUserId);
                    (token, account) = await ForceRefreshTokenForUserAsync(azureAdUserId);
                    
                    _logger.LogInformation("Token refreshed. New AccountId: {AccountId}, Token length: {TokenLength}", 
                        account, 
                        token?.Length ?? 0);
                    
                    // Retry the request with the new token
                    request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Add("Authorization", $"Bearer {token}");
                    request.Headers.Add("User-Agent", "Fortedle App");

                    if (!string.IsNullOrEmpty(account))
                    {
                        request.Headers.Add("Harvest-Account-Id", account);
                        _logger.LogDebug("Retrying Harvest API request with new token. AccountId: {AccountId}", account);
                    }
                    else
                    {
                        _logger.LogWarning("Retrying Harvest API request WITHOUT AccountId header");
                    }

                    response = await _httpClient.SendAsync(request);
                    
                    _logger.LogDebug("Harvest API retry response status: {StatusCode}", response.StatusCode);
                    
                    // If still 401 after refresh, the refresh token might be invalid
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        var retryErrorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Harvest API still returned 401 after token refresh. Response: {ErrorContent}. AccountId used: {AccountId}", 
                            retryErrorContent,
                            account ?? "null");
                        throw new InvalidOperationException(
                            "Harvest authentication failed. The refresh token may be invalid or expired. Please re-authenticate through OAuth.");
                    }
                }
                catch (InvalidOperationException)
                {
                    // Re-throw InvalidOperationException (e.g., no token found)
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refresh token after 401 error");
                    throw new InvalidOperationException(
                        "Harvest authentication failed. Failed to refresh token. Please re-authenticate through OAuth.",
                        ex);
                }
            }

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
        string token;
        string account;
        bool shouldRetryOn401 = !string.IsNullOrEmpty(azureAdUserId);

        // If azureAdUserId is provided, get tokens from database
        if (!string.IsNullOrEmpty(azureAdUserId))
        {
            (token, account) = await GetTokenForUserAsync(azureAdUserId);
            _logger.LogDebug("Retrieved tokens from database for user {AzureAdUserId}. AccountId: {AccountId}, Token length: {TokenLength}", 
                azureAdUserId, 
                account, 
                token?.Length ?? 0);
        }
        else
        {
            // Otherwise, use provided tokens or fallback to configuration
            (token, account) = await GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);
            _logger.LogDebug("Using provided tokens or configuration. AccountId: {AccountId}, Token length: {TokenLength}", 
                account, 
                token?.Length ?? 0);
        }

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogError("Unable to obtain valid access token for GetCurrentUserAsync");
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = "https://api.harvestapp.com/v2/users/me";

        // First attempt
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Headers.Add("User-Agent", "Fortedle App");

        if (!string.IsNullOrEmpty(account))
        {
            request.Headers.Add("Harvest-Account-Id", account);
            _logger.LogDebug("Making Harvest API request to {Url} with AccountId: {AccountId}, Token length: {TokenLength}", 
                url, 
                account,
                token?.Length ?? 0);
        }
        else
        {
            _logger.LogWarning("Making Harvest API request to {Url} WITHOUT AccountId header. Token length: {TokenLength}", 
                url,
                token?.Length ?? 0);
        }

        try
        {
            var response = await _httpClient.SendAsync(request);
            
            _logger.LogDebug("Harvest API response status: {StatusCode} for {Url}", response.StatusCode, url);
            
            // Return null if user not found (404)
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Harvest current user not found (404)");
                return null;
            }

            // Handle 401 Unauthorized - try to refresh token if we have azureAdUserId
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized && shouldRetryOn401)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Harvest API returned 401 Unauthorized. Attempting to refresh token. Response: {ErrorContent}. Request headers: Authorization=Bearer [REDACTED], Harvest-Account-Id={AccountId}",
                    errorContent,
                    account ?? "null");

                // Try to refresh the token and retry
                try
                {
                    if (string.IsNullOrEmpty(azureAdUserId))
                    {
                        throw new InvalidOperationException("Cannot refresh token: azureAdUserId is required");
                    }
                    
                    _logger.LogInformation("Refreshing token for user {AzureAdUserId} before retry", azureAdUserId);
                    (token, account) = await ForceRefreshTokenForUserAsync(azureAdUserId);
                    
                    _logger.LogInformation("Token refreshed. New AccountId: {AccountId}, Token length: {TokenLength}", 
                        account, 
                        token?.Length ?? 0);
                    
                    // Retry the request with the new token
                    request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Add("Authorization", $"Bearer {token}");
                    request.Headers.Add("User-Agent", "Fortedle App");

                    if (!string.IsNullOrEmpty(account))
                    {
                        request.Headers.Add("Harvest-Account-Id", account);
                        _logger.LogDebug("Retrying Harvest API request with new token. AccountId: {AccountId}, Token length: {TokenLength}", 
                            account,
                            token?.Length ?? 0);
                    }
                    else
                    {
                        _logger.LogWarning("Retrying Harvest API request WITHOUT AccountId header. Token length: {TokenLength}", 
                            token?.Length ?? 0);
                    }

                    response = await _httpClient.SendAsync(request);
                    
                    _logger.LogDebug("Harvest API retry response status: {StatusCode}", response.StatusCode);
                    
                    // If still 401 after refresh, the refresh token might be invalid
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        var retryErrorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Harvest API still returned 401 after token refresh. Response: {ErrorContent}. AccountId used: {AccountId}, Token length: {TokenLength}", 
                            retryErrorContent,
                            account ?? "null",
                            token?.Length ?? 0);
                        throw new InvalidOperationException(
                            "Harvest authentication failed. The refresh token may be invalid or expired. Please re-authenticate through OAuth.");
                    }
                }
                catch (InvalidOperationException)
                {
                    // Re-throw InvalidOperationException (e.g., no token found)
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refresh token after 401 error");
                    throw new InvalidOperationException(
                        "Harvest authentication failed. Failed to refresh token. Please re-authenticate through OAuth.",
                        ex);
                }
            }

            // Log non-success status codes for debugging
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Harvest API returned non-success status {StatusCode} when fetching current user. Response: {ErrorContent}. AccountId used: {AccountId}",
                    response.StatusCode,
                    errorContent,
                    account ?? "null");
                
                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    throw new InvalidOperationException(
                        "Harvest authentication failed. The access token may be invalid or expired. Please re-authenticate through OAuth.");
                }
                
                return null;
            }

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<HarvestUser>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null)
            {
                _logger.LogInformation("Successfully fetched Harvest user: {Email} (ID: {UserId})", result.Email, result.Id);
            }
            else
            {
                _logger.LogWarning("Harvest API returned success but deserialized user is null");
            }

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when fetching current user from Harvest API");
            throw new InvalidOperationException(
                "Failed to fetch current user from Harvest API. Please check your connection and try again.",
                ex);
        }
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
        // Get valid token (refresh if needed)
        var (token, account) = await GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);

        if (string.IsNullOrEmpty(token))
        {
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = $"https://api.harvestapp.com/v2/users/{userId}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Headers.Add("User-Agent", "Fortedle App");

        if (!string.IsNullOrEmpty(account))
        {
            request.Headers.Add("Harvest-Account-Id", account);
        }

        try
        {
            var response = await _httpClient.SendAsync(request);
            
            // Return null if user not found (404) or other non-success status
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Harvest user {UserId} not found", userId);
                return null;
            }

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<HarvestUser>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to fetch user from Harvest API for user ID {UserId}", userId);
            return null;
        }
    }
}

using System.Text.Json;
using Fortedle.Server.Models.Application.Harvest;

namespace Fortedle.Server.Services.Harvest;

public interface IHarvestApiClient
{
    Task<List<HarvestTimeEntry>> GetTimeEntriesAsync(
        long userId,
        string from,
        string to,
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null,
        string? azureAdUserId = null);
    Task<HarvestUser?> GetCurrentUserAsync(
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null,
        string? azureAdUserId = null);
    Task<HarvestUser?> GetUserByIdAsync(
        long userId,
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null);
    Task<string?> GetAccountIdFromAccountsEndpointAsync(string accessToken);
}

public class HarvestApiClient : IHarvestApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HarvestApiClient> _logger;
    private readonly IHarvestTokenManager _tokenManager;
    private const string BaseUrl = "https://api.harvestapp.com/v2";
    private const string IdBaseUrl = "https://id.getharvest.com/api/v2";

    public HarvestApiClient(
        HttpClient httpClient,
        ILogger<HarvestApiClient> logger,
        IHarvestTokenManager tokenManager)
    {
        _httpClient = httpClient;
        _logger = logger;
        _tokenManager = tokenManager;
    }

    public async Task<string?> GetAccountIdFromAccountsEndpointAsync(string accessToken)
    {
        try
        {
            var url = $"{IdBaseUrl}/accounts";
            var request = HarvestHttpClientHelper.CreateGetRequest(url, accessToken);

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
            (token, account) = await _tokenManager.GetTokenForUserAsync(azureAdUserId);
            _logger.LogDebug("Retrieved tokens from database for time entries. UserId: {UserId}, AccountId: {AccountId}",
                userId,
                account);
        }
        else
        {
            // Otherwise, use provided tokens or fallback to configuration
            (token, account) = await _tokenManager.GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);
            _logger.LogDebug("Using provided tokens or configuration for time entries. AccountId: {AccountId}", account);
        }

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogError("Unable to obtain valid access token for GetTimeEntriesAsync");
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = $"{BaseUrl}/time_entries?user_id={userId}&from={from}&to={to}";

        return await ExecuteWithRetryOn401Async(
            url,
            token,
            account,
            shouldRetryOn401,
            azureAdUserId,
            async (response) =>
            {
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<HarvestTimeEntriesResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return result?.TimeEntries ?? new List<HarvestTimeEntry>();
            });
    }

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
            (token, account) = await _tokenManager.GetTokenForUserAsync(azureAdUserId);
            _logger.LogDebug("Retrieved tokens from database for user {AzureAdUserId}. AccountId: {AccountId}, Token length: {TokenLength}",
                azureAdUserId,
                account,
                token?.Length ?? 0);
        }
        else
        {
            // Otherwise, use provided tokens or fallback to configuration
            (token, account) = await _tokenManager.GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);
            _logger.LogDebug("Using provided tokens or configuration. AccountId: {AccountId}, Token length: {TokenLength}",
                account,
                token?.Length ?? 0);
        }

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogError("Unable to obtain valid access token for GetCurrentUserAsync");
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = $"{BaseUrl}/users/me";

        return await ExecuteWithRetryOn401Async(
            url,
            token,
            account,
            shouldRetryOn401,
            azureAdUserId,
            async (response) =>
            {
                _logger.LogDebug("Harvest API response status: {StatusCode} for {Url}", response.StatusCode, url);

                // Return null if user not found (404)
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("Harvest current user not found (404)");
                    return null;
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
            });
    }

    public async Task<HarvestUser?> GetUserByIdAsync(
        long userId,
        string? accessToken = null,
        string? refreshToken = null,
        DateTime? tokenExpiresAt = null,
        string? accountId = null)
    {
        // Get valid token (refresh if needed)
        var (token, account) = await _tokenManager.GetValidTokenAsync(accessToken, refreshToken, tokenExpiresAt, accountId);

        if (string.IsNullOrEmpty(token))
        {
            throw new InvalidOperationException("Unable to obtain valid access token");
        }

        var url = $"{BaseUrl}/users/{userId}";
        var request = HarvestHttpClientHelper.CreateGetRequest(url, token, account);

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

    private async Task<T> ExecuteWithRetryOn401Async<T>(
        string url,
        string token,
        string account,
        bool shouldRetryOn401,
        string? azureAdUserId,
        Func<HttpResponseMessage, Task<T>> processResponse)
    {
        // First attempt
        if (!string.IsNullOrEmpty(account))
        {
            _logger.LogDebug("Making Harvest API request to {Url} with AccountId: {AccountId}", url, account);
        }
        else
        {
            _logger.LogWarning("Making Harvest API request to {Url} WITHOUT AccountId header", url);
        }

        try
        {
            var request = HarvestHttpClientHelper.CreateGetRequest(url, token, account);
            var response = await _httpClient.SendAsync(request);

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
                    (token, account) = await _tokenManager.ForceRefreshTokenForUserAsync(azureAdUserId);

                    _logger.LogInformation("Token refreshed. New AccountId: {AccountId}, Token length: {TokenLength}",
                        account,
                        token?.Length ?? 0);

                    // Retry the request with the new token
                    request = HarvestHttpClientHelper.CreateGetRequest(url, token, account);

                    if (!string.IsNullOrEmpty(account))
                    {
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

            // Process the response
            return await processResponse(response);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error when making Harvest API request to {Url}", url);
            throw;
        }
    }
}

using System.Text.Json;
using Fortedle.Server.Models.Application.Harvest;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services.Harvest;

public interface IHarvestTokenManager
{
    Task<(string AccessToken, string AccountId)> GetTokenForUserAsync(string azureAdUserId);
    Task<(string AccessToken, string AccountId)> GetValidTokenAsync(
        string? accessToken,
        string? refreshToken,
        DateTime? tokenExpiresAt,
        string? accountId);
    Task<(string AccessToken, string AccountId)> ForceRefreshTokenForUserAsync(string azureAdUserId);
    string ExtractAccountIdFromToken(string accessToken);
}

public class HarvestTokenManager : IHarvestTokenManager
{
    private readonly IHarvestTokenRepository _harvestTokenRepository;
    private readonly IHarvestOAuthService _oauthService;
    private readonly HttpClient _httpClient;
    private readonly HarvestConfiguration _configuration;
    private readonly ILogger<HarvestTokenManager> _logger;
    private const string IdBaseUrl = "https://id.getharvest.com/api/v2";

    public HarvestTokenManager(
        IHarvestTokenRepository harvestTokenRepository,
        IHarvestOAuthService oauthService,
        HttpClient httpClient,
        HarvestConfiguration configuration,
        ILogger<HarvestTokenManager> logger)
    {
        _harvestTokenRepository = harvestTokenRepository;
        _oauthService = oauthService;
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public string ExtractAccountIdFromToken(string accessToken)
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
                var tokenResponse = await _oauthService.RefreshAccessTokenAsync(refreshToken);
                return (tokenResponse.AccessToken, tokenResponse.AccountId ?? string.Empty);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh token, will try configuration fallback");
            }
        }

        // Fallback to configuration
        var configToken = _configuration.GetAccessToken();
        var configAccount = _configuration.GetAccountId();

        if (string.IsNullOrEmpty(configToken))
        {
            throw new InvalidOperationException(
                "Harvest access token is required but not configured. " +
                "Please authenticate through OAuth or add 'Harvest:AccessToken' and 'Harvest:AccountId' to appsettings.json.");
        }

        return (configToken, configAccount ?? string.Empty);
    }

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

                var tokenResponse = await _oauthService.RefreshAccessTokenAsync(token.RefreshToken);

                _logger.LogDebug("Token refresh response - ExpiresIn: {ExpiresIn}, AccountId from response: {ResponseAccountId}",
                    tokenResponse.ExpiresIn,
                    tokenResponse.AccountId ?? "null");

                // Fetch account ID from the accounts endpoint (more reliable than extracting from token)
                var accessToken = tokenResponse.AccessToken ?? string.Empty;
                var accountId = await GetAccountIdFromAccountsEndpointAsync(accessToken);

                // Fallback to extracting from token if accounts endpoint fails
                if (string.IsNullOrEmpty(accountId))
                {
                    _logger.LogWarning("Failed to get account ID from accounts endpoint, falling back to token extraction");
                    accountId = ExtractAccountIdFromToken(accessToken);
                }

                _logger.LogInformation("Using account ID {AccountId} for user {AzureAdUserId} (previous was {PreviousAccountId})",
                    accountId,
                    azureAdUserId,
                    token.AccountId);

                // Update token in database
                token.AccessToken = accessToken;
                token.RefreshToken = tokenResponse.RefreshToken ?? string.Empty;
                token.ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
                token.AccountId = accountId;

                await _harvestTokenRepository.UpsertAsync(token);
                _logger.LogInformation("Successfully refreshed Harvest token for user {AzureAdUserId}. New AccountId: {AccountId}, ExpiresAt: {ExpiresAt}",
                    azureAdUserId,
                    accountId,
                    token.ExpiresAt);

                return (accessToken, accountId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh Harvest token for user {AzureAdUserId}", azureAdUserId);
                throw new InvalidOperationException(
                    $"Failed to refresh Harvest token for user {azureAdUserId}. Please re-authenticate through OAuth.",
                    ex);
            }
        }

        return (token.AccessToken, token.AccountId ?? string.Empty);
    }

    public async Task<(string AccessToken, string AccountId)> ForceRefreshTokenForUserAsync(string azureAdUserId)
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

            var tokenResponse = await _oauthService.RefreshAccessTokenAsync(token.RefreshToken);

            _logger.LogDebug("Token refresh response received - ExpiresIn: {ExpiresIn}, AccountId from response: {ResponseAccountId}, Token length: {TokenLength}",
                tokenResponse.ExpiresIn,
                tokenResponse.AccountId ?? "null",
                tokenResponse.AccessToken?.Length ?? 0);

            // Fetch account ID from the accounts endpoint (more reliable than extracting from token)
            var accessToken = tokenResponse.AccessToken ?? string.Empty;
            var accountId = await GetAccountIdFromAccountsEndpointAsync(accessToken);

            // Fallback to extracting from token if accounts endpoint fails
            if (string.IsNullOrEmpty(accountId))
            {
                _logger.LogWarning("Failed to get account ID from accounts endpoint, falling back to token extraction");
                accountId = ExtractAccountIdFromToken(accessToken);
            }

            _logger.LogInformation("Using account ID {AccountId} for user {AzureAdUserId} (previous was {PreviousAccountId})",
                accountId,
                azureAdUserId,
                token.AccountId);

            // Update token in database
            token.AccessToken = accessToken;
            token.RefreshToken = tokenResponse.RefreshToken ?? string.Empty;
            token.ExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
            token.AccountId = accountId;

            await _harvestTokenRepository.UpsertAsync(token);
            _logger.LogInformation("Successfully force refreshed Harvest token for user {AzureAdUserId}. New AccountId: {AccountId}, ExpiresAt: {ExpiresAt}",
                azureAdUserId,
                accountId,
                token.ExpiresAt);

            return (accessToken, accountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to force refresh Harvest token for user {AzureAdUserId}", azureAdUserId);
            throw new InvalidOperationException(
                $"Failed to refresh Harvest token for user {azureAdUserId}. Please re-authenticate through OAuth.",
                ex);
        }
    }

    private async Task<string?> GetAccountIdFromAccountsEndpointAsync(string accessToken)
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
}

using System.Text.Json;
using Fortedle.Server.Models.Application.Harvest;

namespace Fortedle.Server.Services.Harvest;

public interface IHarvestOAuthService
{
    Task<HarvestTokenResponse> ExchangeCodeForTokenAsync(string code);
    Task<HarvestTokenResponse> RefreshAccessTokenAsync(string refreshToken);
}

public class HarvestOAuthService : IHarvestOAuthService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HarvestOAuthService> _logger;
    private readonly HarvestConfiguration _configuration;
    private const string TokenEndpoint = "https://id.getharvest.com/api/v2/oauth2/token";

    public HarvestOAuthService(
        HttpClient httpClient,
        ILogger<HarvestOAuthService> logger,
        HarvestConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<HarvestTokenResponse> ExchangeCodeForTokenAsync(string code)
    {
        _configuration.ValidateOAuthConfig();

        var clientId = _configuration.GetClientId()!;
        var clientSecret = _configuration.GetClientSecret()!;
        var redirectUri = _configuration.GetRedirectUri() ?? "http://localhost:5173/time-lottery";

        var requestBody = new List<KeyValuePair<string, string>>
        {
            new("client_id", clientId),
            new("client_secret", clientSecret),
            new("code", code),
            new("grant_type", "authorization_code"),
            new("redirect_uri", redirectUri)
        };

        var request = HarvestHttpClientHelper.CreatePostRequest(
            TokenEndpoint,
            new FormUrlEncodedContent(requestBody));

        try
        {
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<HarvestTokenResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (tokenData == null)
            {
                throw new InvalidOperationException("Failed to deserialize token response");
            }

            return tokenData;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to exchange code for token");
            throw;
        }
    }

    public async Task<HarvestTokenResponse> RefreshAccessTokenAsync(string refreshToken)
    {
        _configuration.ValidateOAuthConfig();

        var clientId = _configuration.GetClientId()!;
        var clientSecret = _configuration.GetClientSecret()!;

        var requestBody = new List<KeyValuePair<string, string>>
        {
            new("client_id", clientId),
            new("client_secret", clientSecret),
            new("refresh_token", refreshToken),
            new("grant_type", "refresh_token")
        };

        var request = HarvestHttpClientHelper.CreatePostRequest(
            TokenEndpoint,
            new FormUrlEncodedContent(requestBody));

        try
        {
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("Token refresh response JSON: {Json}", json);

            var tokenData = JsonSerializer.Deserialize<HarvestTokenResponse>(json, new JsonSerializerOptions
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

            return tokenData;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to refresh access token");
            throw;
        }
    }
}

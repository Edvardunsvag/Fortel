using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Fortedle.Server.Models.DTOs;

namespace Fortedle.Server.Services;

public interface IGledeApiService
{
    Task<GledeCreateOrderResponse> CreateOrderAsync(GledeCreateOrderRequest request);
}

public class GledeApiService : IGledeApiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GledeApiService> _logger;

    public GledeApiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GledeApiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GledeCreateOrderResponse> CreateOrderAsync(GledeCreateOrderRequest request)
    {
        var apiKey = _configuration["Glede:ApiKey"];
        var baseUrl = _configuration["Glede:BaseUrl"] ?? "https://api.glede.app";

        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException(
                "Glede API Key is not configured. Please set Glede:ApiKey in appsettings.json or environment variables.");
        }

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var endpoint = $"{baseUrl}/v1/orders";

        _logger.LogInformation(
            "Creating Glede order for {RecipientCount} recipient(s), amount: {Amount}",
            request.Recipients.Count,
            request.Payment.GiftCardAmount);

        try
        {
            var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync(endpoint, content);

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Glede API request failed with status {StatusCode}: {Response}",
                    response.StatusCode,
                    responseBody);

                // Try to parse error response
                try
                {
                    var errorResponse = JsonSerializer.Deserialize<GledeErrorResponse>(responseBody, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    throw new HttpRequestException(
                        $"Glede API error ({response.StatusCode}): {errorResponse?.Message ?? errorResponse?.Error ?? "Unknown error"}");
                }
                catch (JsonException)
                {
                    throw new HttpRequestException(
                        $"Glede API error ({response.StatusCode}): {responseBody}");
                }
            }

            var orderResponse = JsonSerializer.Deserialize<GledeCreateOrderResponse>(responseBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (orderResponse == null)
            {
                throw new InvalidOperationException("Failed to deserialize Glede API response");
            }

            _logger.LogInformation(
                "Glede order created successfully. Order ID: {OrderId}, Gift count: {GiftCount}",
                orderResponse.OrderId,
                orderResponse.Gifts.Count);

            return orderResponse;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while calling Glede API: {Message}", ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while calling Glede API: {Message}", ex.Message);
            throw;
        }
    }
}

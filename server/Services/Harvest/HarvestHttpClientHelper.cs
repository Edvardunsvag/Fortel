namespace Fortedle.Server.Services.Harvest;

public static class HarvestHttpClientHelper
{
    private const string UserAgent = "Fortedle App";

    public static HttpRequestMessage CreateGetRequest(string url, string? accessToken = null, string? accountId = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        AddHarvestHeaders(request, accessToken, accountId);
        return request;
    }

    public static HttpRequestMessage CreatePostRequest(string url, HttpContent? content = null, string? accessToken = null, string? accountId = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = content
        };
        AddHarvestHeaders(request, accessToken, accountId);
        return request;
    }

    public static void AddHarvestHeaders(HttpRequestMessage request, string? accessToken = null, string? accountId = null)
    {
        request.Headers.Add("User-Agent", UserAgent);

        if (!string.IsNullOrEmpty(accessToken))
        {
            request.Headers.Add("Authorization", $"Bearer {accessToken}");
        }

        if (!string.IsNullOrEmpty(accountId))
        {
            request.Headers.Add("Harvest-Account-Id", accountId);
        }
    }
}

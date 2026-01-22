using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.DTOs;

public class ExchangeTokenRequest
{
    [JsonPropertyName("code")]
    public required string Code { get; set; }

    [JsonPropertyName("state")]
    public required string State { get; set; }
}

public class ExchangeTokenResponse
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

public class RefreshTokenRequest
{
    [JsonPropertyName("refresh_token")]
    public required string RefreshToken { get; set; }
}

public class RefreshTokenResponse
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

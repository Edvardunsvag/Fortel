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

public class HarvestTokenStatusResponse
{
    [JsonPropertyName("is_authenticated")]
    public bool IsAuthenticated { get; set; }

    [JsonPropertyName("account_id")]
    public string? AccountId { get; set; }
}

public class HarvestUserResponse
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

public class HarvestTimeEntryResponse
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
    public HarvestClientResponse? Client { get; set; }
}

public class HarvestClientResponse
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class HarvestTimeEntriesResponse
{
    [JsonPropertyName("time_entries")]
    public List<HarvestTimeEntryResponse> TimeEntries { get; set; } = new();
}

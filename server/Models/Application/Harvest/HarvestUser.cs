using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.Application.Harvest;

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

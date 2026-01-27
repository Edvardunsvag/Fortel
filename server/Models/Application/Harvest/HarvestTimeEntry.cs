using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.Application.Harvest;

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

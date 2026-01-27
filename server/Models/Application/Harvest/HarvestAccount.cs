using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.Application.Harvest;

public class HarvestAccount
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("product")]
    public string Product { get; set; } = string.Empty;
}

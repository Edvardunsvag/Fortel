using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.Application.Harvest;

public class HarvestClient
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.Application.Harvest;

public class HarvestTimeEntriesResponse
{
    [JsonPropertyName("time_entries")]
    public List<HarvestTimeEntry> TimeEntries { get; set; } = new();
}

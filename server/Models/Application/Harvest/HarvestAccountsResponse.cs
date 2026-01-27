using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.Application.Harvest;

public class HarvestAccountsResponse
{
    [JsonPropertyName("user")]
    public HarvestUser? User { get; set; }

    [JsonPropertyName("accounts")]
    public List<HarvestAccount> Accounts { get; set; } = new();
}

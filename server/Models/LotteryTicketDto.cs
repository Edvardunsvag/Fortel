namespace Fortedle.Server.Models;

public class SyncLotteryTicketsRequest
{
    public required string UserId { get; set; }
    public required string Name { get; set; }
    public string? Image { get; set; }
    public required List<string> EligibleWeeks { get; set; } = new();
}

public class SyncLotteryTicketsResponse
{
    public int SyncedCount { get; set; }
    public int SkippedCount { get; set; }
    public int TotalCount { get; set; }
}

public class LotteryTicketDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string EligibleWeek { get; set; } = string.Empty;
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WinnerDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string Week { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class WeeklyWinnersDto
{
    public string Week { get; set; } = string.Empty;
    public List<WinnerDto> Winners { get; set; } = new();
}

public class AllWinnersResponse
{
    public List<WeeklyWinnersDto> WeeklyWinners { get; set; } = new();
}

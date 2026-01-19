namespace Fortedle.Server.Models.DTOs;

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

public class EmployeeStatisticsDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public int TicketCount { get; set; }
    public int WinCount { get; set; }
}

public class EmployeeStatisticsResponse
{
    public List<EmployeeStatisticsDto> Employees { get; set; } = new();
}

// Monthly lottery / Grand Finale wheel DTOs
public class MonthlyWinnerDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string? Color { get; set; }
    public string Month { get; set; } = string.Empty;
    public int Position { get; set; }
    public int TicketsConsumed { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MonthlyWinnersResponse
{
    public string Month { get; set; } = string.Empty;
    public List<MonthlyWinnerDto> Winners { get; set; } = new();
    public bool IsDrawComplete { get; set; }
}

public class WheelSegmentDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string Color { get; set; } = string.Empty;
    public int TicketId { get; set; }
}

public class WheelParticipantDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string Color { get; set; } = string.Empty;
    public int TicketCount { get; set; }
}

public class WheelDataResponse
{
    public List<WheelSegmentDto> Segments { get; set; } = new();
    public List<WheelParticipantDto> Participants { get; set; } = new();
    public int TotalTickets { get; set; }
}

public class LotteryConfigDto
{
    public int MonthlyWinnerCount { get; set; }
    public DateTime NextMonthlyDrawDate { get; set; }
    public string CurrentMonth { get; set; } = string.Empty;
}

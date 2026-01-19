namespace Fortedle.Server.Models.DTOs;

public class SyncHarvestRequest
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
    public required DateTime ExpiresAt { get; set; }
    public required string AccountId { get; set; }
}

public class SyncHarvestResponse
{
    public int WeeksSynced { get; set; }
    public int WeeksUpdated { get; set; }
    public int TicketsSynced { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
}

public class EmployeeWeekDto
{
    public string WeekKey { get; set; } = string.Empty; // e.g., "2024-W01"
    public DateTime WeekStart { get; set; } // Monday date
    public DateTime WeekEnd { get; set; } // Friday date
    public double Hours { get; set; } // Total hours
    public double BillableHours { get; set; } // Hours at client
    public bool IsLotteryEligible { get; set; }
    public bool HasTicket { get; set; } // Whether user has a lottery ticket for this week
    public bool HasWon { get; set; } // Whether user won this week
    public bool WinnerDrawn { get; set; } // Whether winner has been drawn for this week
    public DateTime? CountdownTarget { get; set; } // Friday 15:00 of that week (for countdown)
    public WinnerDto? Winner { get; set; } // Winner info if drawn and user won
}

public class EmployeeWeeksResponse
{
    public List<EmployeeWeekDto> Weeks { get; set; } = new();
}

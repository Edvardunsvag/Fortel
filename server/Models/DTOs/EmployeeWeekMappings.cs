using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class EmployeeWeekExtensions
{
    public static EmployeeWeekDto ToDto(this EmployeeWeek entity)
    {
        return new EmployeeWeekDto
        {
            WeekKey = entity.WeekKey,
            WeekStart = entity.WeekStart,
            WeekEnd = entity.WeekEnd,
            Hours = entity.Hours,
            BillableHours = entity.BillableHours,
            IsLotteryEligible = entity.IsLotteryEligible,
            // HasTicket, HasWon, WinnerDrawn, CountdownTarget, Winner will be set by service
            HasTicket = false,
            HasWon = false,
            WinnerDrawn = false,
            CountdownTarget = null,
            Winner = null,
        };
    }
}

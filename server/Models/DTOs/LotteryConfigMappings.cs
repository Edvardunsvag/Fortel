using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class LotteryConfigExtensions
{
    public static LotteryConfigDto ToDto(this LotteryConfig entity, int monthlyWinnerCount, DateTime nextMonthlyDrawDate, string currentMonth)
    {
        return new LotteryConfigDto
        {
            MonthlyWinnerCount = monthlyWinnerCount,
            NextMonthlyDrawDate = nextMonthlyDrawDate,
            CurrentMonth = currentMonth,
        };
    }
}

using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface IWheelDataService
{
    Task<WheelDataResponse> GetWheelDataAsync();
    Task<MonthlyWinnersResponse> GetMonthlyWinnersAsync(string? month = null);
    Task<MonthlyWinnersResponse> GetLatestMonthlyWinnersAsync();
    Task<LotteryConfigDto> GetLotteryConfigAsync();
}

public class WheelDataService : IWheelDataService
{
    private const string MonthlyWinnerCountKey = "MonthlyWinnerCount";
    private const int DefaultWinnerCount = 3;

    // Predefined colors for participants (distinct, vibrant colors)
    private static readonly string[] ParticipantColors = new[]
    {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
        "#F8B500", "#00CED1", "#FF69B4", "#32CD32", "#FF7F50",
        "#9370DB", "#20B2AA", "#FFD700", "#FF6347", "#00FA9A"
    };

    private readonly ILotteryTicketRepository _lotteryTicketRepository;
    private readonly IMonthlyWinningTicketRepository _monthlyWinningTicketRepository;
    private readonly IMonthlyLotteryDrawingService _monthlyDrawingService;
    private readonly ILogger<WheelDataService> _logger;

    public WheelDataService(
        ILotteryTicketRepository lotteryTicketRepository,
        IMonthlyWinningTicketRepository monthlyWinningTicketRepository,
        IMonthlyLotteryDrawingService monthlyDrawingService,
        ILogger<WheelDataService> logger)
    {
        _lotteryTicketRepository = lotteryTicketRepository;
        _monthlyWinningTicketRepository = monthlyWinningTicketRepository;
        _monthlyDrawingService = monthlyDrawingService;
        _logger = logger;
    }

    public async Task<WheelDataResponse> GetWheelDataAsync()
    {
        // Get ALL lottery tickets to build the complete participants list
        var allTickets = await _lotteryTicketRepository.GetAllAsync();

        if (allTickets.Count == 0)
        {
            return new WheelDataResponse
            {
                Segments = new List<WheelSegmentDto>(),
                Participants = new List<WheelParticipantDto>(),
                TotalTickets = 0
            };
        }

        // Group ALL tickets by user to get participants (shows everyone, even with 0 remaining)
        var allUserGroups = allTickets
            .GroupBy(t => t.UserId)
            .ToList();

        // Assign deterministic colors based on userId hash (consistent regardless of list order)
        var participants = allUserGroups
            .Select(g => new WheelParticipantDto
            {
                UserId = g.Key,
                Name = g.First().Name,
                Image = g.First().Image,
                Color = GetColorForUser(g.Key),
                // Only count UNUSED tickets for display
                TicketCount = g.Count(t => !t.IsUsed)
            })
            .OrderByDescending(p => p.TicketCount)
            .ToList();

        // Create color lookup from all participants
        var colorByUserId = participants.ToDictionary(p => p.UserId, p => p.Color);

        // Get only UNUSED tickets for wheel segments
        var unusedTickets = allTickets.Where(t => !t.IsUsed).ToList();

        // Create segments (one per unused ticket)
        var segments = unusedTickets.Select(t => new WheelSegmentDto
        {
            UserId = t.UserId,
            Name = t.Name,
            Image = t.Image,
            Color = colorByUserId[t.UserId],
            TicketId = t.Id
        }).ToList();

        return new WheelDataResponse
        {
            Segments = segments,
            Participants = participants,
            TotalTickets = unusedTickets.Count
        };
    }

    public async Task<MonthlyWinnersResponse> GetMonthlyWinnersAsync(string? month = null)
    {
        var targetMonth = month ?? GetCurrentMonthString();

        var winners = await _monthlyWinningTicketRepository.GetByMonthAsync(targetMonth);

        var winnerDtos = winners.Select(w => w.ToDto()).ToList();

        var winnerCount = await _monthlyDrawingService.GetMonthlyWinnerCountAsync();

        return new MonthlyWinnersResponse
        {
            Month = targetMonth,
            Winners = winnerDtos,
            IsDrawComplete = winners.Count >= winnerCount
        };
    }

    public async Task<MonthlyWinnersResponse> GetLatestMonthlyWinnersAsync()
    {
        // Find the most recent month with winners
        var latestMonth = await _monthlyWinningTicketRepository.GetLatestMonthAsync();

        if (string.IsNullOrEmpty(latestMonth))
        {
            // No winners yet, return current month's empty response
            return await GetMonthlyWinnersAsync();
        }

        return await GetMonthlyWinnersAsync(latestMonth);
    }

    public async Task<LotteryConfigDto> GetLotteryConfigAsync()
    {
        var winnerCount = await _monthlyDrawingService.GetMonthlyWinnerCountAsync();

        return new LotteryConfigDto
        {
            MonthlyWinnerCount = winnerCount,
            NextMonthlyDrawDate = GetNextMonthlyDrawDate(),
            CurrentMonth = GetCurrentMonthString()
        };
    }

    private static string GetColorForUser(string userId)
    {
        // Use djb2 hash algorithm for TRULY deterministic color assignment
        // NOTE: String.GetHashCode() is NOT deterministic in .NET Core (randomized per app restart)
        unchecked
        {
            int hash = 5381;
            foreach (char c in userId)
            {
                hash = ((hash << 5) + hash) + c;
            }
            var colorIndex = Math.Abs(hash) % ParticipantColors.Length;
            return ParticipantColors[colorIndex];
        }
    }

    private static string GetCurrentMonthString()
    {
        var now = DateTime.UtcNow;
        return $"{now.Year}-{now.Month:D2}";
    }

    private static DateTime GetNextMonthlyDrawDate()
    {
        // Last Friday of current month at 15:00 UTC
        var now = DateTime.UtcNow;
        var year = now.Year;
        var month = now.Month;

        // Get last day of month
        var lastDayOfMonth = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        // Find last Friday
        var daysToSubtract = ((int)lastDayOfMonth.DayOfWeek - (int)DayOfWeek.Friday + 7) % 7;
        var lastFriday = lastDayOfMonth.AddDays(-daysToSubtract);

        // Set time to 15:00 UTC
        var drawDate = new DateTime(lastFriday.Year, lastFriday.Month, lastFriday.Day, 15, 0, 0, DateTimeKind.Utc);

        // If the draw date has passed, get next month's last Friday
        if (drawDate <= now)
        {
            // Move to next month
            if (month == 12)
            {
                year++;
                month = 1;
            }
            else
            {
                month++;
            }

            lastDayOfMonth = new DateTime(year, month, DateTime.DaysInMonth(year, month));
            daysToSubtract = ((int)lastDayOfMonth.DayOfWeek - (int)DayOfWeek.Friday + 7) % 7;
            lastFriday = lastDayOfMonth.AddDays(-daysToSubtract);
            drawDate = new DateTime(lastFriday.Year, lastFriday.Month, lastFriday.Day, 15, 0, 0, DateTimeKind.Utc);
        }

        return drawDate;
    }
}

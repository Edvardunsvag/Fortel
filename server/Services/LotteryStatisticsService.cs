using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface ILotteryStatisticsService
{
    Task<EmployeeStatisticsResponse> GetEmployeeStatisticsAsync();
}

public class LotteryStatisticsService : ILotteryStatisticsService
{
    private readonly ILotteryTicketRepository _lotteryTicketRepository;
    private readonly IWinningTicketRepository _winningTicketRepository;
    private readonly ILogger<LotteryStatisticsService> _logger;

    public LotteryStatisticsService(
        ILotteryTicketRepository lotteryTicketRepository,
        IWinningTicketRepository winningTicketRepository,
        ILogger<LotteryStatisticsService> logger)
    {
        _lotteryTicketRepository = lotteryTicketRepository;
        _winningTicketRepository = winningTicketRepository;
        _logger = logger;
    }

    public async Task<EmployeeStatisticsResponse> GetEmployeeStatisticsAsync()
    {
        // Get all unique users with lottery tickets
        var usersWithTickets = await _lotteryTicketRepository.GetUserTicketCountsAsync();

        // Get win counts per user
        var winCounts = await _winningTicketRepository.GetUserWinCountsAsync();

        // Create a dictionary for quick lookup of win counts
        var winCountDict = winCounts.ToDictionary(w => w.UserId, w => w.WinCount);

        // Map to DTOs
        var employeeStats = usersWithTickets.Select(u => new EmployeeStatisticsDto
        {
            UserId = u.UserId,
            Name = u.Name,
            Image = u.Image,
            TicketCount = u.TicketCount,
            WinCount = winCountDict.GetValueOrDefault(u.UserId, 0)
        })
        .OrderByDescending(e => e.TicketCount)
        .ThenByDescending(e => e.WinCount)
        .ThenBy(e => e.Name)
        .ToList();

        _logger.LogInformation("Retrieved statistics for {Count} employees", employeeStats.Count);

        return new EmployeeStatisticsResponse
        {
            Employees = employeeStats
        };
    }
}

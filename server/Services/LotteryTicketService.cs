using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface ILotteryTicketService
{
    Task<SyncLotteryTicketsResponse> SyncLotteryTicketsAsync(SyncLotteryTicketsRequest request);
    Task<List<LotteryTicketDto>> GetLotteryTicketsByUserIdAsync(string userId);
}

public class LotteryTicketService : ILotteryTicketService
{
    private readonly ILotteryTicketRepository _lotteryTicketRepository;
    private readonly ILogger<LotteryTicketService> _logger;

    public LotteryTicketService(
        ILotteryTicketRepository lotteryTicketRepository,
        ILogger<LotteryTicketService> logger)
    {
        _lotteryTicketRepository = lotteryTicketRepository;
        _logger = logger;
    }

    public async Task<SyncLotteryTicketsResponse> SyncLotteryTicketsAsync(SyncLotteryTicketsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            throw new ArgumentException("UserId is required", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Name is required", nameof(request));
        }

        if (request.EligibleWeeks == null || request.EligibleWeeks.Count == 0)
        {
            return new SyncLotteryTicketsResponse
            {
                SyncedCount = 0,
                SkippedCount = 0,
                TotalCount = 0
            };
        }

        var syncedCount = 0;
        var skippedCount = 0;

        foreach (var eligibleWeek in request.EligibleWeeks)
        {
            if (string.IsNullOrWhiteSpace(eligibleWeek))
            {
                continue;
            }

            // Check if ticket already exists for this user and week
            var existingTicket = await _lotteryTicketRepository.GetByUserIdAndWeekAsync(request.UserId, eligibleWeek);

            if (existingTicket != null)
            {
                // Skip if already exists (no duplicates)
                skippedCount++;
                continue;
            }

            // Create new ticket
            var ticket = new LotteryTicket
            {
                UserId = request.UserId,
                Name = request.Name,
                Image = request.Image,
                EligibleWeek = eligibleWeek,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            await _lotteryTicketRepository.AddAsync(ticket);
            syncedCount++;
        }

        _logger.LogInformation(
            "Synced lottery tickets for user {UserId}: {SyncedCount} new, {SkippedCount} skipped",
            request.UserId,
            syncedCount,
            skippedCount);

        return new SyncLotteryTicketsResponse
        {
            SyncedCount = syncedCount,
            SkippedCount = skippedCount,
            TotalCount = request.EligibleWeeks.Count
        };
    }

    public async Task<List<LotteryTicketDto>> GetLotteryTicketsByUserIdAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        var tickets = await _lotteryTicketRepository.GetByUserIdAsync(userId);

        return tickets.Select(t => t.ToDto()).ToList();
    }
}

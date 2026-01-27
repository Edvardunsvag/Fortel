using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface ILotteryTicketService
{
    Task<SyncLotteryTicketsResponse> SyncLotteryTicketsAsync(SyncLotteryTicketsRequest request);
    Task<List<LotteryTicketDto>> GetLotteryTicketsByUserIdAsync(string userId);
    Task<SeedTestDataResult> SeedTestDataAsync();
}

/// <summary>
/// Result of seeding test data
/// </summary>
public record SeedTestDataResult(int TicketsCreated, int TicketsSkipped, int TotalRequested);

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

    public async Task<SeedTestDataResult> SeedTestDataAsync()
    {
        const int totalTickets = 40;
        const int usersCount = 10;
        const int weeksPerUser = 4;

        var ticketsCreated = 0;
        var ticketsSkipped = 0;
        var currentYear = DateTime.UtcNow.Year;

        // Generate 10 users with 4 weeks each = 40 unique tickets
        for (int userIndex = 1; userIndex <= usersCount; userIndex++)
        {
            var userId = $"test-user-{userIndex:D3}";
            var userName = $"Test User {userIndex}";
            var userImage = $"https://api.dicebear.com/7.x/avataaars/svg?seed={userName}";

            // Generate 4 different weeks for each user
            for (int weekIndex = 1; weekIndex <= weeksPerUser; weekIndex++)
            {
                // Create unique weeks: each user gets consecutive weeks
                // User 1: W01-W04, User 2: W05-W08, etc.
                var weekNumber = ((userIndex - 1) * weeksPerUser + weekIndex);
                // Ensure week number is between 1 and 52
                if (weekNumber > 52)
                {
                    weekNumber = ((weekNumber - 1) % 52) + 1;
                }
                var eligibleWeek = $"{currentYear}-W{weekNumber:D2}";

                // Check if ticket already exists
                var existingTicket = await _lotteryTicketRepository.GetByUserIdAndWeekAsync(userId, eligibleWeek);

                if (existingTicket != null)
                {
                    ticketsSkipped++;
                    continue;
                }

                // Create new ticket
                var ticket = new LotteryTicket
                {
                    UserId = userId,
                    Name = userName,
                    Image = userImage,
                    EligibleWeek = eligibleWeek,
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                await _lotteryTicketRepository.AddAsync(ticket);
                ticketsCreated++;
            }
        }

        _logger.LogInformation(
            "Seeded test lottery tickets: {Created} created, {Skipped} skipped",
            ticketsCreated,
            ticketsSkipped);

        return new SeedTestDataResult(ticketsCreated, ticketsSkipped, totalTickets);
    }
}

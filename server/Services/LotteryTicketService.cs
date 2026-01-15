using Fortedle.Server.Data;
using Fortedle.Server.Data.Entities;
using Fortedle.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Services;

public interface ILotteryTicketService
{
    Task<SyncLotteryTicketsResponse> SyncLotteryTicketsAsync(SyncLotteryTicketsRequest request);
    Task<List<LotteryTicketDto>> GetLotteryTicketsByUserIdAsync(string userId);
}

public class LotteryTicketService : ILotteryTicketService
{
    private readonly AppDbContext _context;
    private readonly ILogger<LotteryTicketService> _logger;

    public LotteryTicketService(AppDbContext context, ILogger<LotteryTicketService> logger)
    {
        _context = context;
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
            var existingTicket = await _context.LotteryTickets
                .FirstOrDefaultAsync(t => t.UserId == request.UserId && t.EligibleWeek == eligibleWeek);

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

            _context.LotteryTickets.Add(ticket);
            syncedCount++;
        }

        await _context.SaveChangesAsync();

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

        var tickets = await _context.LotteryTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tickets.Select(t => new LotteryTicketDto
        {
            Id = t.Id,
            UserId = t.UserId,
            Name = t.Name,
            Image = t.Image,
            EligibleWeek = t.EligibleWeek,
            IsUsed = t.IsUsed,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
        }).ToList();
    }
}

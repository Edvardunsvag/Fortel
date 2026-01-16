using Fortedle.Server.Data;
using Fortedle.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Services;

public interface ILotteryDrawingService
{
    Task DrawWeekWinner();
}

public class LotteryDrawingService : ILotteryDrawingService
{
    private const int WinnersPerWeek = 1;

    private readonly AppDbContext _context;
    private readonly ILogger<LotteryDrawingService> _logger;

    public LotteryDrawingService(AppDbContext context, ILogger<LotteryDrawingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task DrawWeekWinner()
    {
        try
        {
            _logger.LogInformation("Starting lottery drawing...");

            // Get current week in format "YYYY-Www" (e.g., "2024-W01")
            var now = DateTime.UtcNow;
            var week = GetWeekString(now);

            // Check if we've already drawn the required number of winners for this week
            var existingWinnersCount = await _context.WinningTickets
                .Where(w => w.Week == week)
                .CountAsync();

            if (existingWinnersCount >= WinnersPerWeek)
            {
                _logger.LogInformation("Already have {Count} winners for week {Week}. Skipping drawing.", existingWinnersCount, week);
                return;
            }

            // Get all lottery tickets that are not used
            var availableTickets = await _context.LotteryTickets
                .Where(t => !t.IsUsed)
                .ToListAsync();

            if (availableTickets.Count == 0)
            {
                _logger.LogWarning("No available lottery tickets found. Skipping drawing.");
                return;
            }

            if (availableTickets.Count < WinnersPerWeek)
            {
                _logger.LogWarning("Only {Count} available tickets found. Drawing all available tickets.", availableTickets.Count);
            }

            // Pick random tickets (or fewer if less than WinnersPerWeek available)
            var ticketsToDraw = Math.Min(WinnersPerWeek, availableTickets.Count);
            var random = new Random();
            var winningTickets = availableTickets
                .OrderBy(_ => random.Next())
                .Take(ticketsToDraw)
                .ToList();

            // Mark selected tickets as used
            foreach (var ticket in winningTickets)
            {
                ticket.IsUsed = true;
                ticket.UpdatedAt = DateTime.UtcNow;
            }

            // Create WinningTicket records
            var winningTicketEntities = winningTickets.Select(ticket => new WinningTicket
            {
                UserId = ticket.UserId,
                LotteryTicketId = ticket.Id,
                Week = week,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.WinningTickets.AddRange(winningTicketEntities);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully drew {Count} winning tickets for week {Week}. Winners: {Winners}",
                winningTicketEntities.Count,
                week,
                string.Join(", ", winningTicketEntities.Select(w => $"UserId: {w.UserId}, TicketId: {w.LotteryTicketId}")));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during lottery drawing: {Message}", ex.Message);
            throw;
        }
    }

    private static string GetWeekString(DateTime date)
    {
        // Get ISO 8601 week number and year (handles year boundaries correctly)
        var weekNumber = System.Globalization.ISOWeek.GetWeekOfYear(date);
        var weekYear = System.Globalization.ISOWeek.GetYear(date);

        // Format as "YYYY-Www" (e.g., "2024-W01")
        return $"{weekYear}-W{weekNumber:D2}";
    }
}

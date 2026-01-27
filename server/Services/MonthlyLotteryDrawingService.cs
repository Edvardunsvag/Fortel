using Fortedle.Server.Models.Database;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface IMonthlyLotteryDrawingService
{
    Task DrawMonthlyWinnersAsync();
    Task<int> GetMonthlyWinnerCountAsync();
    Task<ConsumeWinnerResult> ConsumeWinnerTicketsAsync(string month, int position);
    Task<ResetMonthResult> ResetMonthAsync(string? month = null);
}

/// <summary>
/// Result of consuming winner tickets
/// </summary>
public record ConsumeWinnerResult(bool Success, int TicketsConsumed, string UserId, string? ErrorMessage = null);

/// <summary>
/// Result of resetting month
/// </summary>
public record ResetMonthResult(bool Success, int WinnersRemoved, int TicketsRestored);

public class MonthlyLotteryDrawingService : IMonthlyLotteryDrawingService
{
    private const string MonthlyWinnerCountKey = "MonthlyWinnerCount";
    private const int DefaultWinnerCount = 3;

    // Same colors as WheelDataService for consistency
    private static readonly string[] ParticipantColors = new[]
    {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
        "#F8B500", "#00CED1", "#FF69B4", "#32CD32", "#FF7F50",
        "#9370DB", "#20B2AA", "#FFD700", "#FF6347", "#00FA9A"
    };

    private readonly ILotteryTicketRepository _lotteryTicketRepository;
    private readonly IMonthlyWinningTicketRepository _monthlyWinningTicketRepository;
    private readonly ILotteryConfigRepository _lotteryConfigRepository;
    private readonly ILogger<MonthlyLotteryDrawingService> _logger;

    public MonthlyLotteryDrawingService(
        ILotteryTicketRepository lotteryTicketRepository,
        IMonthlyWinningTicketRepository monthlyWinningTicketRepository,
        ILotteryConfigRepository lotteryConfigRepository,
        ILogger<MonthlyLotteryDrawingService> logger)
    {
        _lotteryTicketRepository = lotteryTicketRepository;
        _monthlyWinningTicketRepository = monthlyWinningTicketRepository;
        _lotteryConfigRepository = lotteryConfigRepository;
        _logger = logger;
    }

    public async Task<int> GetMonthlyWinnerCountAsync()
    {
        var config = await _lotteryConfigRepository.GetByKeyAsync(MonthlyWinnerCountKey);

        if (config == null || !int.TryParse(config.Value, out var count))
        {
            return DefaultWinnerCount;
        }

        return count;
    }

    public async Task DrawMonthlyWinnersAsync()
    {
        try
        {
            _logger.LogInformation("Starting monthly lottery drawing...");

            // Get current month in format "YYYY-MM" (e.g., "2024-01")
            var now = DateTime.UtcNow;
            var month = GetMonthString(now);

            // Get winner count from config
            var winnerCount = await GetMonthlyWinnerCountAsync();
            _logger.LogInformation("Drawing {Count} winners for month {Month}", winnerCount, month);

            // Check if we've already drawn winners for this month
            var existingWinnersCount = await _monthlyWinningTicketRepository.GetCountByMonthAsync(month);

            if (existingWinnersCount >= winnerCount)
            {
                _logger.LogInformation("Already have {Count} winners for month {Month}. Skipping drawing.", existingWinnersCount, month);
                return;
            }

            // Get all unused lottery tickets grouped by user
            var allTickets = await _lotteryTicketRepository.GetUnusedAsync();
            var ticketsByUser = allTickets
                .GroupBy(t => t.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Name = g.First().Name,
                    Image = g.First().Image,
                    Tickets = g.ToList()
                })
                .ToList();

            if (ticketsByUser.Count == 0)
            {
                _logger.LogWarning("No available lottery tickets found. Skipping monthly drawing.");
                return;
            }

            // Create weighted list where each ticket is an entry
            var weightedEntries = ticketsByUser
                .SelectMany(u => u.Tickets.Select(_ => new
                {
                    u.UserId,
                    u.Name,
                    u.Image,
                    TicketCount = u.Tickets.Count,
                    AllTicketIds = u.Tickets.Select(t => t.Id).ToList()
                }))
                .ToList();

            if (weightedEntries.Count == 0)
            {
                _logger.LogWarning("No weighted entries found. Skipping monthly drawing.");
                return;
            }

            var actualWinnerCount = Math.Min(winnerCount, ticketsByUser.Count);
            _logger.LogInformation("Drawing {Count} winners from {Participants} participants with {TotalTickets} total tickets",
                actualWinnerCount, ticketsByUser.Count, weightedEntries.Count);

            // Build color lookup for each user (same logic as WheelDataService - hash only, no index)
            var userColorLookup = ticketsByUser
                .ToDictionary(u => u.UserId, u => GetColorForUser(u.UserId));

            // Randomly select winners (weighted by ticket count)
            var random = new Random();
            var selectedWinners = new List<(string UserId, string Name, string? Image, int TicketCount, List<int> AllTicketIds, string Color)>();
            var availableEntries = weightedEntries.ToList();

            for (int position = 1; position <= actualWinnerCount; position++)
            {
                if (availableEntries.Count == 0) break;

                // Pick random entry
                var winnerIndex = random.Next(availableEntries.Count);
                var winner = availableEntries[winnerIndex];

                // Get the winner's color from the lookup
                var winnerColor = userColorLookup.GetValueOrDefault(winner.UserId, "#888888");
                selectedWinners.Add((winner.UserId, winner.Name, winner.Image, winner.TicketCount, winner.AllTicketIds, winnerColor));

                // Remove all entries for this user (so they can't win twice)
                availableEntries.RemoveAll(e => e.UserId == winner.UserId);
            }

            // Create MonthlyWinningTicket records (tickets will be consumed after reveal in UI)
            var position_ = existingWinnersCount + 1; // Start from next position
            foreach (var winner in selectedWinners)
            {
                // Create winning record
                var winningTicket = new MonthlyWinningTicket
                {
                    UserId = winner.UserId,
                    Name = winner.Name,
                    Image = winner.Image,
                    Month = month,
                    Position = position_,
                    TicketsConsumed = winner.TicketCount,
                    Color = winner.Color,
                    CreatedAt = DateTime.UtcNow
                };
                await _monthlyWinningTicketRepository.AddAsync(winningTicket);

                // NOTE: Tickets are NOT marked as used here anymore.
                // They will be consumed via the consume-winner endpoint after the UI reveals them.

                _logger.LogInformation(
                    "Position {Position}: User {UserId} ({Name}) selected as winner with {TicketCount} tickets.",
                    position_, winner.UserId, winner.Name, winner.TicketCount);

                position_++;
            }

            _logger.LogInformation(
                "Successfully drew {Count} monthly winners for {Month}. Winners: {Winners}",
                selectedWinners.Count,
                month,
                string.Join(", ", selectedWinners.Select(w => $"{w.Name} ({w.TicketCount} tickets)")));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during monthly lottery drawing: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<ConsumeWinnerResult> ConsumeWinnerTicketsAsync(string month, int position)
    {
        // Find the winning ticket for this position
        var winner = await _monthlyWinningTicketRepository.GetByMonthAndPositionAsync(month, position);

        if (winner == null)
        {
            return new ConsumeWinnerResult(false, 0, string.Empty, $"Winner not found for month {month} position {position}");
        }

        // Mark all of this user's unused tickets as used
        var ticketsConsumed = await _lotteryTicketRepository.MarkUserTicketsAsUsedAsync(winner.UserId);

        _logger.LogInformation(
            "Consumed {Count} tickets for winner {UserId} (position {Position}, month {Month})",
            ticketsConsumed, winner.UserId, position, month);

        return new ConsumeWinnerResult(true, ticketsConsumed, winner.UserId);
    }

    public async Task<ResetMonthResult> ResetMonthAsync(string? month = null)
    {
        var targetMonth = month ?? GetMonthString(DateTime.UtcNow);

        // Restore ALL used tickets (not just current month's winners)
        var ticketsRestored = await _lotteryTicketRepository.MarkAllTicketsAsUnusedAsync();

        // Delete ALL monthly winners (full reset)
        var winnersRemoved = await _monthlyWinningTicketRepository.DeleteAllAsync();

        _logger.LogInformation(
            "Full reset: restored {TicketCount} tickets, removed {WinnerCount} winners",
            ticketsRestored, winnersRemoved);

        return new ResetMonthResult(true, winnersRemoved, ticketsRestored);
    }

    private static string GetMonthString(DateTime date)
    {
        return $"{date.Year}-{date.Month:D2}";
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
}

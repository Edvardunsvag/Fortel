using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface ILotteryTicketRepository
{
    Task<List<LotteryTicket>> GetByUserIdAsync(string userId);
    Task<LotteryTicket?> GetByUserIdAndWeekAsync(string userId, string week);
    Task<List<LotteryTicket>> GetAllAsync();
    Task<List<LotteryTicket>> GetUnusedAsync();
    Task<List<UserTicketCount>> GetUserTicketCountsAsync();
    Task<LotteryTicket> AddAsync(LotteryTicket ticket);
    Task UpdateAsync(LotteryTicket ticket);
    Task UpdateRangeAsync(List<LotteryTicket> tickets);
    Task<int> MarkUserTicketsAsUsedAsync(string userId);
    Task<int> MarkAllTicketsAsUnusedAsync();
}

/// <summary>
/// DTO for user ticket counts used in statistics
/// </summary>
public record UserTicketCount(string UserId, string Name, string? Image, int TicketCount);

public class LotteryTicketRepository : ILotteryTicketRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<LotteryTicketRepository> _logger;

    public LotteryTicketRepository(AppDbContext context, ILogger<LotteryTicketRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<LotteryTicket>> GetByUserIdAsync(string userId)
    {
        return await _context.LotteryTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<LotteryTicket?> GetByUserIdAndWeekAsync(string userId, string week)
    {
        return await _context.LotteryTickets
            .FirstOrDefaultAsync(t => t.UserId == userId && t.EligibleWeek == week);
    }

    public async Task<List<LotteryTicket>> GetAllAsync()
    {
        return await _context.LotteryTickets
            .OrderBy(t => t.UserId)
            .ThenBy(t => t.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<LotteryTicket>> GetUnusedAsync()
    {
        return await _context.LotteryTickets
            .Where(t => !t.IsUsed)
            .ToListAsync();
    }

    public async Task<List<UserTicketCount>> GetUserTicketCountsAsync()
    {
        return await _context.LotteryTickets
            .GroupBy(t => new { t.UserId, t.Name, t.Image })
            .Select(g => new UserTicketCount(
                g.Key.UserId,
                g.Key.Name,
                g.Key.Image,
                g.Count()))
            .ToListAsync();
    }

    public async Task<LotteryTicket> AddAsync(LotteryTicket ticket)
    {
        _context.LotteryTickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task UpdateAsync(LotteryTicket ticket)
    {
        _context.LotteryTickets.Update(ticket);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateRangeAsync(List<LotteryTicket> tickets)
    {
        _context.LotteryTickets.UpdateRange(tickets);
        await _context.SaveChangesAsync();
    }

    public async Task<int> MarkUserTicketsAsUsedAsync(string userId)
    {
        var tickets = await _context.LotteryTickets
            .Where(t => t.UserId == userId && !t.IsUsed)
            .ToListAsync();

        foreach (var ticket in tickets)
        {
            ticket.IsUsed = true;
            ticket.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return tickets.Count;
    }

    public async Task<int> MarkAllTicketsAsUnusedAsync()
    {
        var tickets = await _context.LotteryTickets
            .Where(t => t.IsUsed)
            .ToListAsync();

        foreach (var ticket in tickets)
        {
            ticket.IsUsed = false;
            ticket.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return tickets.Count;
    }
}

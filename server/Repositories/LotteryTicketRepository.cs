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
    Task<LotteryTicket> AddAsync(LotteryTicket ticket);
    Task UpdateAsync(LotteryTicket ticket);
    Task UpdateRangeAsync(List<LotteryTicket> tickets);
}

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
}

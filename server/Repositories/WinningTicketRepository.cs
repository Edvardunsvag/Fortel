using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IWinningTicketRepository
{
    Task<int> GetCountByWeekAsync(string week);
    Task<List<WinningTicket>> GetByWeekAsync(string week);
    Task<List<WinningTicket>> GetAllAsync();
    Task<List<WinningTicket>> GetAllWithLotteryTicketsAsync();
    Task<List<UserWinCount>> GetUserWinCountsAsync();
    Task<WinningTicket?> GetByIdAsync(int id);
    Task<WinningTicket> AddAsync(WinningTicket ticket);
    Task AddRangeAsync(List<WinningTicket> tickets);
}

/// <summary>
/// DTO for user win counts used in statistics
/// </summary>
public record UserWinCount(string UserId, int WinCount);

public class WinningTicketRepository : IWinningTicketRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<WinningTicketRepository> _logger;

    public WinningTicketRepository(AppDbContext context, ILogger<WinningTicketRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> GetCountByWeekAsync(string week)
    {
        return await _context.WinningTickets
            .Where(w => w.Week == week)
            .CountAsync();
    }

    public async Task<List<WinningTicket>> GetByWeekAsync(string week)
    {
        return await _context.WinningTickets
            .Where(w => w.Week == week)
            .Include(w => w.LotteryTicket)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<WinningTicket>> GetAllAsync()
    {
        return await _context.WinningTickets
            .Include(w => w.LotteryTicket)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<WinningTicket>> GetAllWithLotteryTicketsAsync()
    {
        return await _context.WinningTickets
            .Include(w => w.LotteryTicket)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<UserWinCount>> GetUserWinCountsAsync()
    {
        return await _context.WinningTickets
            .GroupBy(wt => wt.UserId)
            .Select(g => new UserWinCount(g.Key, g.Count()))
            .ToListAsync();
    }

    public async Task<WinningTicket?> GetByIdAsync(int id)
    {
        return await _context.WinningTickets
            .Include(w => w.LotteryTicket)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id);
    }

    public async Task<WinningTicket> AddAsync(WinningTicket ticket)
    {
        _context.WinningTickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task AddRangeAsync(List<WinningTicket> tickets)
    {
        _context.WinningTickets.AddRange(tickets);
        await _context.SaveChangesAsync();
    }
}

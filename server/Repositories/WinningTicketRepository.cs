using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IWinningTicketRepository
{
    Task<int> GetCountByWeekAsync(string week);
    Task<List<WinningTicket>> GetByWeekAsync(string week);
    Task<List<WinningTicket>> GetAllAsync();
    Task<WinningTicket> AddAsync(WinningTicket ticket);
    Task AddRangeAsync(List<WinningTicket> tickets);
}

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

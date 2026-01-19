using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IMonthlyWinningTicketRepository
{
    Task<int> GetCountByMonthAsync(string month);
    Task<List<MonthlyWinningTicket>> GetByMonthAsync(string month);
    Task<string?> GetLatestMonthAsync();
    Task<MonthlyWinningTicket> AddAsync(MonthlyWinningTicket ticket);
}

public class MonthlyWinningTicketRepository : IMonthlyWinningTicketRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<MonthlyWinningTicketRepository> _logger;

    public MonthlyWinningTicketRepository(AppDbContext context, ILogger<MonthlyWinningTicketRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> GetCountByMonthAsync(string month)
    {
        return await _context.MonthlyWinningTickets
            .Where(w => w.Month == month)
            .CountAsync();
    }

    public async Task<List<MonthlyWinningTicket>> GetByMonthAsync(string month)
    {
        return await _context.MonthlyWinningTickets
            .Where(w => w.Month == month)
            .OrderBy(w => w.Position)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<string?> GetLatestMonthAsync()
    {
        return await _context.MonthlyWinningTickets
            .OrderByDescending(w => w.Month)
            .Select(w => w.Month)
            .FirstOrDefaultAsync();
    }

    public async Task<MonthlyWinningTicket> AddAsync(MonthlyWinningTicket ticket)
    {
        _context.MonthlyWinningTickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }
}

using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface ILeaderboardRepository
{
    Task<List<LeaderboardEntry>> GetByDateAsync(DateOnly date);
    Task<LeaderboardEntry?> GetByPlayerNameAndDateAsync(string playerName, DateOnly date);
    Task<LeaderboardEntry> AddAsync(LeaderboardEntry entry);
    Task UpdateAsync(LeaderboardEntry entry);
}

public class LeaderboardRepository : ILeaderboardRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<LeaderboardRepository> _logger;

    public LeaderboardRepository(AppDbContext context, ILogger<LeaderboardRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<LeaderboardEntry>> GetByDateAsync(DateOnly date)
    {
        return await _context.LeaderboardEntries
            .Where(e => e.Date == date)
            .OrderBy(e => e.Score)
            .ThenBy(e => e.CreatedAt)
            .Take(100)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<LeaderboardEntry?> GetByPlayerNameAndDateAsync(string playerName, DateOnly date)
    {
        return await _context.LeaderboardEntries
            .FirstOrDefaultAsync(e => e.PlayerName == playerName && e.Date == date);
    }

    public async Task<LeaderboardEntry> AddAsync(LeaderboardEntry entry)
    {
        _context.LeaderboardEntries.Add(entry);
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task UpdateAsync(LeaderboardEntry entry)
    {
        _context.LeaderboardEntries.Update(entry);
        await _context.SaveChangesAsync();
    }
}

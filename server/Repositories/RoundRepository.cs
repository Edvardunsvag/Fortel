using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IRoundRepository
{
    Task<Round?> GetByUserIdAndDateAsync(string userId, DateOnly date);
    Task<Round?> GetByIdAsync(int id);
    Task<Round> AddAsync(Round round);
    Task UpdateAsync(Round round);
}

public class RoundRepository : IRoundRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<RoundRepository> _logger;

    public RoundRepository(AppDbContext context, ILogger<RoundRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Round?> GetByUserIdAndDateAsync(string userId, DateOnly date)
    {
        return await _context.Rounds
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Date == date);
    }

    public async Task<Round?> GetByIdAsync(int id)
    {
        return await _context.Rounds
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Round> AddAsync(Round round)
    {
        _context.Rounds.Add(round);
        await _context.SaveChangesAsync();
        return round;
    }

    public async Task UpdateAsync(Round round)
    {
        _context.Rounds.Update(round);
        await _context.SaveChangesAsync();
    }
}

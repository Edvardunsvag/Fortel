using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface ILotteryConfigRepository
{
    Task<LotteryConfig?> GetByKeyAsync(string key);
    Task<List<LotteryConfig>> GetAllAsync();
    Task<LotteryConfig> AddOrUpdateAsync(LotteryConfig config);
}

public class LotteryConfigRepository : ILotteryConfigRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<LotteryConfigRepository> _logger;

    public LotteryConfigRepository(AppDbContext context, ILogger<LotteryConfigRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LotteryConfig?> GetByKeyAsync(string key)
    {
        return await _context.LotteryConfigs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);
    }

    public async Task<List<LotteryConfig>> GetAllAsync()
    {
        return await _context.LotteryConfigs
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<LotteryConfig> AddOrUpdateAsync(LotteryConfig config)
    {
        var existing = await _context.LotteryConfigs
            .FirstOrDefaultAsync(c => c.Key == config.Key);

        if (existing != null)
        {
            existing.Value = config.Value;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existing;
        }
        else
        {
            _context.LotteryConfigs.Add(config);
            await _context.SaveChangesAsync();
            return config;
        }
    }
}

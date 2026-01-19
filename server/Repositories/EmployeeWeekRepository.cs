using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IEmployeeWeekRepository
{
    Task<List<EmployeeWeek>> GetByUserIdAsync(string userId);
    Task<EmployeeWeek?> GetByUserIdAndWeekAsync(string userId, string weekKey);
    Task<EmployeeWeek> AddAsync(EmployeeWeek week);
    Task UpdateAsync(EmployeeWeek week);
    Task UpsertAsync(EmployeeWeek week);
}

public class EmployeeWeekRepository : IEmployeeWeekRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<EmployeeWeekRepository> _logger;

    public EmployeeWeekRepository(AppDbContext context, ILogger<EmployeeWeekRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<EmployeeWeek>> GetByUserIdAsync(string userId)
    {
        return await _context.EmployeeWeeks
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.WeekStart)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<EmployeeWeek?> GetByUserIdAndWeekAsync(string userId, string weekKey)
    {
        return await _context.EmployeeWeeks
            .FirstOrDefaultAsync(w => w.UserId == userId && w.WeekKey == weekKey);
    }

    public async Task<EmployeeWeek> AddAsync(EmployeeWeek week)
    {
        _context.EmployeeWeeks.Add(week);
        await _context.SaveChangesAsync();
        return week;
    }

    public async Task UpdateAsync(EmployeeWeek week)
    {
        _context.EmployeeWeeks.Update(week);
        await _context.SaveChangesAsync();
    }

    public async Task UpsertAsync(EmployeeWeek week)
    {
        var existing = await GetByUserIdAndWeekAsync(week.UserId, week.WeekKey);
        
        if (existing != null)
        {
            // Update existing
            existing.Hours = week.Hours;
            existing.BillableHours = week.BillableHours;
            existing.IsLotteryEligible = week.IsLotteryEligible;
            existing.WeekStart = week.WeekStart;
            existing.WeekEnd = week.WeekEnd;
            existing.UpdatedAt = DateTime.UtcNow;
            _context.EmployeeWeeks.Update(existing);
        }
        else
        {
            // Add new
            week.CreatedAt = DateTime.UtcNow;
            week.UpdatedAt = DateTime.UtcNow;
            _context.EmployeeWeeks.Add(week);
        }
        
        await _context.SaveChangesAsync();
    }
}

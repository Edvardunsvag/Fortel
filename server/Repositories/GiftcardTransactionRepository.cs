using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IGiftcardTransactionRepository
{
    Task<GiftcardTransaction> AddAsync(GiftcardTransaction transaction);
    Task<GiftcardTransaction> UpdateAsync(GiftcardTransaction transaction);
    Task<GiftcardTransaction?> GetByIdAsync(int id);
    Task<List<GiftcardTransaction>> GetAllAsync();
    Task<List<GiftcardTransaction>> GetByUserIdAsync(string userId);
    Task<List<GiftcardTransaction>> GetByStatusAsync(string status);
    Task<List<GiftcardTransaction>> GetByReasonAsync(string reason);
}

public class GiftcardTransactionRepository : IGiftcardTransactionRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<GiftcardTransactionRepository> _logger;

    public GiftcardTransactionRepository(
        AppDbContext context,
        ILogger<GiftcardTransactionRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<GiftcardTransaction> AddAsync(GiftcardTransaction transaction)
    {
        _context.GiftcardTransactions.Add(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<GiftcardTransaction> UpdateAsync(GiftcardTransaction transaction)
    {
        _context.GiftcardTransactions.Update(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<GiftcardTransaction?> GetByIdAsync(int id)
    {
        return await _context.GiftcardTransactions
            .Include(g => g.Employee)
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<List<GiftcardTransaction>> GetAllAsync()
    {
        return await _context.GiftcardTransactions
            .Include(g => g.Employee)
            .OrderByDescending(g => g.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<GiftcardTransaction>> GetByUserIdAsync(string userId)
    {
        return await _context.GiftcardTransactions
            .Where(g => g.UserId == userId)
            .Include(g => g.Employee)
            .OrderByDescending(g => g.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<GiftcardTransaction>> GetByStatusAsync(string status)
    {
        return await _context.GiftcardTransactions
            .Where(g => g.Status == status)
            .Include(g => g.Employee)
            .OrderByDescending(g => g.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<GiftcardTransaction>> GetByReasonAsync(string reason)
    {
        return await _context.GiftcardTransactions
            .Where(g => g.Reason == reason)
            .Include(g => g.Employee)
            .OrderByDescending(g => g.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }
}

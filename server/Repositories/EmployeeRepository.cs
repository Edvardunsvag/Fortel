using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IEmployeeRepository
{
    Task<List<Employee>> GetAllAsync();
    Task<List<Employee>> GetAllWithEmailAsync();
    Task<Employee?> GetByIdAsync(string id);
    Task<Employee?> GetByIdForUpdateAsync(string id);
    Task<bool> ExistsAsync(string id);
    Task<Employee> AddAsync(Employee employee);
    Task UpdateAsync(Employee employee);
    Task DeleteAllAsync();
}

public class EmployeeRepository : IEmployeeRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<EmployeeRepository> _logger;

    public EmployeeRepository(AppDbContext context, ILogger<EmployeeRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Employee>> GetAllAsync()
    {
        return await _context.Employees
            .OrderBy(e => e.Name)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<Employee>> GetAllWithEmailAsync()
    {
        return await _context.Employees
            .Where(e => !string.IsNullOrEmpty(e.Email))
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Employee?> GetByIdAsync(string id)
    {
        return await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Employee?> GetByIdForUpdateAsync(string id)
    {
        return await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Employees
            .AnyAsync(e => e.Id == id);
    }

    public async Task<Employee> AddAsync(Employee employee)
    {
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();
        return employee;
    }

    public async Task UpdateAsync(Employee employee)
    {
        _context.Employees.Update(employee);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAllAsync()
    {
        // Use EF Core's DeleteRange for better safety and consistency
        // This is safer than raw SQL and maintains consistency with other operations
        var allEmployees = await _context.Employees.ToListAsync();
        _context.Employees.RemoveRange(allEmployees);
        await _context.SaveChangesAsync();
    }
}

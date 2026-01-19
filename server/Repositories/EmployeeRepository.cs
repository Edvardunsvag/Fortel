using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IEmployeeRepository
{
    Task<List<Employee>> GetAllAsync();
    Task<Employee?> GetByIdAsync(string id);
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

    public async Task<Employee?> GetByIdAsync(string id)
    {
        return await _context.Employees
            .AsNoTracking()
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
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM employees");
    }
}

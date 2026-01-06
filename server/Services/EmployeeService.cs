using Fortedle.Server.Data;
using Fortedle.Server.Data.Entities;
using Fortedle.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Services;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetEmployeesAsync();
}

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _context;

    public EmployeeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmployeeDto>> GetEmployeesAsync()
    {
        var employees = await _context.Employees
            .OrderBy(e => e.Name)
            .ToListAsync();

        return employees.Select(e => new EmployeeDto
        {
            Id = e.Id,
            Name = e.Name,
            FirstName = e.FirstName,
            Surname = e.Surname,
            AvatarImageUrl = e.AvatarImageUrl,
            Department = e.Department,
            Office = e.Office,
            Teams = e.Teams ?? new List<string>(),
            Age = e.Age,
            Supervisor = e.Supervisor ?? "-",
            Funfact = e.Funfact,
            Interests = e.Interests ?? new List<string>(),
        }).ToList();
    }
}


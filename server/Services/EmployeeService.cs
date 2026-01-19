using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetEmployeesAsync();
}

public class EmployeeService : IEmployeeService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(
        IEmployeeRepository employeeRepository,
        ILogger<EmployeeService> logger)
    {
        _employeeRepository = employeeRepository;
        _logger = logger;
    }

    public async Task<List<EmployeeDto>> GetEmployeesAsync()
    {
        var employees = await _employeeRepository.GetAllAsync();
        return employees.Select(e => e.ToDto()).ToList();
    }
}

using Fortedle.Server.Models;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeService employeeService,
        ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<EmployeeDto>>> GetEmployees()
    {
        try
        {
            var employees = await _employeeService.GetEmployeesAsync();
            return Ok(employees);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching employees");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}


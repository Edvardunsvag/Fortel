using Fortedle.Server.Helpers;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeWeeksController : ControllerBase
{
    private readonly IEmployeeWeekService _employeeWeekService;
    private readonly ILogger<EmployeeWeeksController> _logger;

    public EmployeeWeeksController(
        IEmployeeWeekService employeeWeekService,
        ILogger<EmployeeWeeksController> logger)
    {
        _employeeWeekService = employeeWeekService;
        _logger = logger;
    }

    [HttpPost("sync")]
    public async Task<ActionResult<SyncHarvestResponse>> SyncFromHarvest()
    {
        try
        {
            // Extract user email from JWT token
            var userEmail = UserClaimsHelper.GetUserEmail(User);
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning("Unable to extract user email from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            // Backend will retrieve tokens from database automatically
            var response = await _employeeWeekService.SyncFromHarvestAsync(userEmail);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid request for syncing from Harvest");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing from Harvest");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<EmployeeWeeksResponse>> GetEmployeeWeeks([FromQuery] string userId)
    {
        try
        {
            // Note: userId here is the Harvest user ID (numeric), not the Azure AD email
            // The data in employee_weeks is stored with Harvest user IDs
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            var response = await _employeeWeekService.GetEmployeeWeeksAsync(userId);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for getting employee weeks");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching employee weeks");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

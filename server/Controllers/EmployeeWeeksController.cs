using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    public async Task<ActionResult<SyncHarvestResponse>> SyncFromHarvest([FromBody] SyncHarvestRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.AccessToken))
            {
                return BadRequest(new { error = "accessToken is required" });
            }

            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new { error = "refreshToken is required" });
            }

            if (string.IsNullOrWhiteSpace(request.AccountId))
            {
                return BadRequest(new { error = "accountId is required" });
            }

            var response = await _employeeWeekService.SyncFromHarvestAsync(request);
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

using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

    /// <summary>
    /// Extract user email from JWT token claims
    /// Tries preferred_username, email, or User.Identity.Name
    /// </summary>
    private string? GetUserEmail()
    {
        // Try preferred_username first (most common in Azure AD v2.0 tokens)
        var preferredUsername = User.FindFirst("preferred_username")?.Value;
        if (!string.IsNullOrWhiteSpace(preferredUsername))
        {
            return preferredUsername;
        }

        // Try email claim
        var email = User.FindFirst(ClaimTypes.Email)?.Value 
                   ?? User.FindFirst("email")?.Value;
        if (!string.IsNullOrWhiteSpace(email))
        {
            return email;
        }

        // Fallback to User.Identity.Name
        return User.Identity?.Name;
    }

    [HttpPost("sync")]
    public async Task<ActionResult<SyncHarvestResponse>> SyncFromHarvest()
    {
        try
        {
            // Extract user email from JWT token
            var userEmail = GetUserEmail();
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

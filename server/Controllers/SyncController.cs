using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SyncController : ControllerBase
{
    private readonly ISyncService _syncService;
    private readonly ILogger<SyncController> _logger;

    public SyncController(
        ISyncService syncService,
        ILogger<SyncController> logger)
    {
        _syncService = syncService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<SyncResponse>> SyncEmployees([FromBody] SyncRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.AccessToken))
            {
                return BadRequest(new { error = "Access token is required" });
            }

            var response = await _syncService.SyncEmployeesAsync(request.AccessToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Authentication failed during sync");
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing employees");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}


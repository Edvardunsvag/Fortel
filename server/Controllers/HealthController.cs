using Fortedle.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        AppDbContext context,
        ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetHealth()
    {
        var healthStatus = new
        {
            status = "ok",
            timestamp = DateTime.UtcNow.ToString("O"),
            database = new
            {
                connected = false,
                error = (string?)null,
            },
        };

        try
        {
            // Test database connection
            await _context.Database.CanConnectAsync();
            healthStatus = new
            {
                status = "ok",
                timestamp = DateTime.UtcNow.ToString("O"),
                database = new
                {
                    connected = true,
                    error = (string?)null,
                },
            };

            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            var errorStatus = new
            {
                status = "degraded",
                timestamp = DateTime.UtcNow.ToString("O"),
                database = new
                {
                    connected = false,
                    error = ex.Message,
                },
            };

            return StatusCode(503, errorStatus);
        }
    }
}


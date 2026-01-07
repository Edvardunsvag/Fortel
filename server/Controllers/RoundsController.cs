using Fortedle.Server.Models;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoundsController : ControllerBase
{
    private readonly IRoundService _roundService;
    private readonly ILogger<RoundsController> _logger;

    public RoundsController(
        IRoundService roundService,
        ILogger<RoundsController> logger)
    {
        _roundService = roundService;
        _logger = logger;
    }

    [HttpGet("current")]
    public async Task<ActionResult<RoundDto>> GetCurrentRound([FromQuery] string userId, [FromQuery] string? date = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            var round = await _roundService.GetCurrentRoundAsync(userId, date);
            
            if (round == null)
            {
                return NotFound(new { error = "No round found" });
            }

            return Ok(round);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching current round");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("start")]
    public async Task<ActionResult<RoundDto>> StartRound([FromBody] StartRoundRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            var round = await _roundService.StartRoundAsync(request);
            return Ok(round);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting round");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("guess")]
    public async Task<ActionResult<RoundDto>> SaveGuess([FromBody] SaveGuessRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            if (request.Guess == null)
            {
                return BadRequest(new { error = "guess is required" });
            }

            var round = await _roundService.SaveGuessAsync(request);
            return Ok(round);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Round not found for guess");
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving guess");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}


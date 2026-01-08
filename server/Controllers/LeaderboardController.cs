using Fortedle.Server.Models;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;
    private readonly ILogger<LeaderboardController> _logger;

    public LeaderboardController(
        ILeaderboardService leaderboardService,
        ILogger<LeaderboardController> logger)
    {
        _leaderboardService = leaderboardService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<LeaderboardDto>> GetLeaderboard([FromQuery] string? date = null)
    {
        try
        {
            var leaderboard = await _leaderboardService.GetLeaderboardAsync(date);
            return Ok(leaderboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching leaderboard");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("submit-score")]
    public async Task<ActionResult<SubmitScoreResponse>> SubmitScore([FromBody] SubmitScoreRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { error = "Name is required and must be a non-empty string" });
            }

            if (request.Score < 1)
            {
                return BadRequest(new { error = "Score must be a positive integer" });
            }

            var response = await _leaderboardService.SubmitScoreAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting score");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}


using Fortedle.Server.Helpers;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    public async Task<ActionResult<RoundDto>> GetCurrentRound([FromQuery] string? date = null)
    {
        try
        {
            // Extract userId from JWT claims - users can only access their own rounds
            var userId = UserClaimsHelper.GetUserId(User);
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Unable to extract user ID from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
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
            // Extract userId from JWT claims - override any userId in request for security
            var userId = UserClaimsHelper.GetUserId(User);
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Unable to extract user ID from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            // Log warning if request contains different userId (potential tampering attempt)
            if (!string.IsNullOrWhiteSpace(request.UserId) && request.UserId != userId)
            {
                _logger.LogWarning("Request userId {RequestUserId} does not match authenticated user {AuthUserId}. Using authenticated user ID.",
                    request.UserId, userId);
            }

            // Override request UserId with authenticated user's ID
            request.UserId = userId;

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
            // Extract userId from JWT claims - override any userId in request for security
            var userId = UserClaimsHelper.GetUserId(User);
            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("Unable to extract user ID from JWT token");
                return Unauthorized(new { error = "Unable to identify user. Please log in again." });
            }

            // Log warning if request contains different userId (potential tampering attempt)
            if (!string.IsNullOrWhiteSpace(request.UserId) && request.UserId != userId)
            {
                _logger.LogWarning("Request userId {RequestUserId} does not match authenticated user {AuthUserId}. Using authenticated user ID.",
                    request.UserId, userId);
            }

            // Override request UserId with authenticated user's ID
            request.UserId = userId;

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

    [HttpPost("reveal-funfact")]
    public async Task<ActionResult<RoundDto>> RevealFunfact([FromBody] RevealFunfactRequest request)
    {
        try
        {
            if (request.RoundId <= 0)
            {
                return BadRequest(new { error = "roundId is required and must be greater than 0" });
            }

            var round = await _roundService.RevealFunfactAsync(request);
            return Ok(round);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Round not found for funfact reveal");
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revealing funfact");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}


using Fortedle.Server.Models;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LotteryTicketsController : ControllerBase
{
    private readonly ILotteryTicketService _lotteryTicketService;
    private readonly ILogger<LotteryTicketsController> _logger;

    public LotteryTicketsController(
        ILotteryTicketService lotteryTicketService,
        ILogger<LotteryTicketsController> logger)
    {
        _lotteryTicketService = lotteryTicketService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<LotteryTicketDto>>> GetTickets([FromQuery] string userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            var tickets = await _lotteryTicketService.GetLotteryTicketsByUserIdAsync(userId);
            return Ok(tickets);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for getting lottery tickets");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching lottery tickets");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("sync")]
    public async Task<ActionResult<SyncLotteryTicketsResponse>> SyncTickets([FromBody] SyncLotteryTicketsRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { error = "name is required" });
            }

            if (request.EligibleWeeks == null || request.EligibleWeeks.Count == 0)
            {
                return BadRequest(new { error = "eligibleWeeks is required and must not be empty" });
            }

            var response = await _lotteryTicketService.SyncLotteryTicketsAsync(request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for syncing lottery tickets");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing lottery tickets");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

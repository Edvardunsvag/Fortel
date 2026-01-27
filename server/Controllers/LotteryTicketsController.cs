using Fortedle.Server.Helpers;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LotteryTicketsController : ControllerBase
{
    private readonly ILotteryTicketService _lotteryTicketService;
    private readonly IWheelDataService _wheelDataService;
    private readonly IMonthlyLotteryDrawingService _monthlyDrawingService;
    private readonly IWinnersService _winnersService;
    private readonly ILotteryStatisticsService _statisticsService;
    private readonly ILogger<LotteryTicketsController> _logger;

    public LotteryTicketsController(
        ILotteryTicketService lotteryTicketService,
        IWheelDataService wheelDataService,
        IMonthlyLotteryDrawingService monthlyDrawingService,
        IWinnersService winnersService,
        ILotteryStatisticsService statisticsService,
        ILogger<LotteryTicketsController> logger)
    {
        _lotteryTicketService = lotteryTicketService;
        _wheelDataService = wheelDataService;
        _monthlyDrawingService = monthlyDrawingService;
        _winnersService = winnersService;
        _statisticsService = statisticsService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<LotteryTicketDto>>> GetTickets([FromQuery] string userId)
    {
        try
        {
            // Note: userId here is the Harvest user ID (numeric), not the Azure AD email
            // The data in lottery_tickets is stored with Harvest user IDs
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

    [HttpGet("winners")]
    public async Task<ActionResult<AllWinnersResponse>> GetWinners()
    {
        try
        {
            var response = await _winnersService.GetWinnersAsync();
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching winners");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<EmployeeStatisticsResponse>> GetEmployeeStatistics()
    {
        try
        {
            var response = await _statisticsService.GetEmployeeStatisticsAsync();
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching employee statistics");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("seed-test-data")]
    public async Task<ActionResult<object>> SeedTestData()
    {
        try
        {
            var result = await _lotteryTicketService.SeedTestDataAsync();

            return Ok(new
            {
                message = "Test lottery tickets seeded successfully",
                ticketsCreated = result.TicketsCreated,
                ticketsSkipped = result.TicketsSkipped,
                totalRequested = result.TotalRequested
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding test lottery tickets");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("wheel")]
    public async Task<ActionResult<WheelDataResponse>> GetWheelData()
    {
        try
        {
            var wheelData = await _wheelDataService.GetWheelDataAsync();
            return Ok(wheelData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching wheel data");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("monthly-winners")]
    public async Task<ActionResult<MonthlyWinnersResponse>> GetMonthlyWinners([FromQuery] string? month = null)
    {
        try
        {
            var winners = await _wheelDataService.GetMonthlyWinnersAsync(month);
            return Ok(winners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching monthly winners");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("monthly-winners/latest")]
    public async Task<ActionResult<MonthlyWinnersResponse>> GetLatestMonthlyWinners()
    {
        try
        {
            var winners = await _wheelDataService.GetLatestMonthlyWinnersAsync();
            return Ok(winners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching latest monthly winners");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("config")]
    public async Task<ActionResult<LotteryConfigDto>> GetLotteryConfig()
    {
        try
        {
            var config = await _wheelDataService.GetLotteryConfigAsync();
            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching lottery config");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("monthly-draw")]
    public async Task<ActionResult<object>> TriggerMonthlyDraw()
    {
        try
        {
            await _monthlyDrawingService.DrawMonthlyWinnersAsync();
            var winners = await _wheelDataService.GetMonthlyWinnersAsync();
            return Ok(new
            {
                message = "Monthly draw completed successfully",
                winners = winners.Winners
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering monthly draw");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("consume-winner/{month}/{position:int}")]
    public async Task<ActionResult<object>> ConsumeWinnerTickets(string month, int position)
    {
        try
        {
            var result = await _monthlyDrawingService.ConsumeWinnerTicketsAsync(month, position);

            if (!result.Success)
            {
                return NotFound(new { error = result.ErrorMessage });
            }

            return Ok(new
            {
                message = "Winner tickets consumed successfully",
                ticketsConsumed = result.TicketsConsumed,
                userId = result.UserId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error consuming winner tickets");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("reset-month")]
    public async Task<ActionResult<object>> ResetMonth([FromQuery] string? month = null)
    {
        try
        {
            var result = await _monthlyDrawingService.ResetMonthAsync(month);

            return Ok(new
            {
                message = "Full reset completed successfully",
                winnersRemoved = result.WinnersRemoved,
                ticketsRestored = result.TicketsRestored
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting month");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

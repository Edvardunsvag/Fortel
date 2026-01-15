using Fortedle.Server.Data;
using Fortedle.Server.Data.Entities;
using Fortedle.Server.Models;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LotteryTicketsController : ControllerBase
{
    private readonly ILotteryTicketService _lotteryTicketService;
    private readonly AppDbContext _context;
    private readonly ILogger<LotteryTicketsController> _logger;

    public LotteryTicketsController(
        ILotteryTicketService lotteryTicketService,
        AppDbContext context,
        ILogger<LotteryTicketsController> logger)
    {
        _lotteryTicketService = lotteryTicketService;
        _context = context;
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

    [HttpPost("seed-test-data")]
    public async Task<ActionResult<object>> SeedTestData()
    {
        try
        {
            const int totalTickets = 40;
            const int usersCount = 10;
            const int weeksPerUser = 4;

            var ticketsCreated = 0;
            var ticketsSkipped = 0;
            var currentYear = DateTime.UtcNow.Year;

            // Generate 10 users with 4 weeks each = 40 unique tickets
            for (int userIndex = 1; userIndex <= usersCount; userIndex++)
            {
                var userId = $"test-user-{userIndex:D3}";
                var userName = $"Test User {userIndex}";
                var userImage = $"https://api.dicebear.com/7.x/avataaars/svg?seed={userName}";

                // Generate 4 different weeks for each user
                for (int weekIndex = 1; weekIndex <= weeksPerUser; weekIndex++)
                {
                    // Create unique weeks: each user gets consecutive weeks
                    // User 1: W01-W04, User 2: W05-W08, etc.
                    var weekNumber = ((userIndex - 1) * weeksPerUser + weekIndex);
                    // Ensure week number is between 1 and 52
                    if (weekNumber > 52)
                    {
                        weekNumber = ((weekNumber - 1) % 52) + 1;
                    }
                    var eligibleWeek = $"{currentYear}-W{weekNumber:D2}";

                    // Check if ticket already exists
                    var existingTicket = await _context.LotteryTickets
                        .FirstOrDefaultAsync(t => t.UserId == userId && t.EligibleWeek == eligibleWeek);

                    if (existingTicket != null)
                    {
                        ticketsSkipped++;
                        continue;
                    }

                    // Create new ticket
                    var ticket = new LotteryTicket
                    {
                        UserId = userId,
                        Name = userName,
                        Image = userImage,
                        EligibleWeek = eligibleWeek,
                        IsUsed = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };

                    _context.LotteryTickets.Add(ticket);
                    ticketsCreated++;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Seeded test lottery tickets: {Created} created, {Skipped} skipped",
                ticketsCreated,
                ticketsSkipped);

            return Ok(new
            {
                message = "Test lottery tickets seeded successfully",
                ticketsCreated,
                ticketsSkipped,
                totalRequested = totalTickets
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding test lottery tickets");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

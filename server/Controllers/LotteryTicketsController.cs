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

    [HttpGet("winners")]
    public async Task<ActionResult<AllWinnersResponse>> GetWinners()
    {
        try
        {
            // Query winning tickets joined with lottery tickets to get Name and Image
            var winners = await _context.WinningTickets
                .Include(wt => wt.LotteryTicket)
                .OrderByDescending(wt => wt.Week)
                .ThenByDescending(wt => wt.CreatedAt)
                .Select(wt => new WinnerDto
                {
                    UserId = wt.UserId,
                    Name = wt.LotteryTicket != null ? wt.LotteryTicket.Name : string.Empty,
                    Image = wt.LotteryTicket != null ? wt.LotteryTicket.Image : null,
                    Week = wt.Week,
                    CreatedAt = wt.CreatedAt
                })
                .ToListAsync();

            // Get all employees for email matching (include all employees with email, even if avatarImageUrl is null)
            var employees = await _context.Employees
                .Where(e => !string.IsNullOrEmpty(e.Email))
                .ToListAsync();

            _logger.LogInformation("Loaded {Count} employees with email addresses for matching", employees.Count);

            // For winners with null images, try to get harvest user email from database and match with employees
            foreach (var winner in winners)
            {
                if (string.IsNullOrEmpty(winner.Image))
                {
                    _logger.LogInformation("Processing winner with null image: UserId={UserId}, Name={Name}", winner.UserId, winner.Name);
                    
                    // Try to parse userId as int (Harvest user ID)
                    if (int.TryParse(winner.UserId, out var harvestUserId))
                    {
                        _logger.LogInformation("Parsed userId {UserId} as harvestUserId {HarvestUserId}", winner.UserId, harvestUserId);
                        
                        try
                        {
                            // Fetch harvest user email from harvest_users table
                            _logger.LogInformation("Fetching harvest user email for ID {HarvestUserId} from database", harvestUserId);
                            
                            // Use raw SQL query to get email from harvest_users table
                            string? harvestUserEmail = null;
                            
                            var connection = _context.Database.GetDbConnection();
                            var wasOpen = connection.State == System.Data.ConnectionState.Open;
                            
                            if (!wasOpen)
                            {
                                await connection.OpenAsync();
                            }
                            
                            try
                            {
                                using var command = connection.CreateCommand();
                                command.CommandText = "SELECT email FROM harvest_users WHERE harvest_user_id = @userId LIMIT 1";
                                var parameter = command.CreateParameter();
                                parameter.ParameterName = "@userId";
                                parameter.Value = harvestUserId;
                                command.Parameters.Add(parameter);
                                
                                var result = await command.ExecuteScalarAsync();
                                harvestUserEmail = result?.ToString();
                            }
                            finally
                            {
                                if (!wasOpen)
                                {
                                    await connection.CloseAsync();
                                }
                            }

                            if (string.IsNullOrEmpty(harvestUserEmail))
                            {
                                _logger.LogWarning("Harvest user {HarvestUserId} not found in harvest_users table or has no email", harvestUserId);
                                continue;
                            }

                            _logger.LogInformation("Fetched harvest user email: {Email} for user ID {HarvestUserId}", harvestUserEmail, harvestUserId);

                            // Find matching employee by email (case-insensitive)
                            var matchingEmployee = employees.FirstOrDefault(e => 
                                !string.IsNullOrEmpty(e.Email) && 
                                e.Email.Equals(harvestUserEmail, StringComparison.OrdinalIgnoreCase));

                            if (matchingEmployee == null)
                            {
                                _logger.LogWarning("No employee found matching email {Email} for harvest user {HarvestUserId}", 
                                    harvestUserEmail, harvestUserId);
                                continue;
                            }

                            _logger.LogInformation("Found matching employee: Id={EmployeeId}, Name={EmployeeName}, Email={EmployeeEmail}, HasAvatar={HasAvatar}", 
                                matchingEmployee.Id, matchingEmployee.Name, matchingEmployee.Email, 
                                !string.IsNullOrEmpty(matchingEmployee.AvatarImageUrl));

                            if (string.IsNullOrEmpty(matchingEmployee.AvatarImageUrl))
                            {
                                _logger.LogWarning("Matching employee {EmployeeId} has no AvatarImageUrl", matchingEmployee.Id);
                                continue;
                            }

                            winner.Image = matchingEmployee.AvatarImageUrl;
                            _logger.LogInformation(
                                "Successfully matched winner {UserId} ({WinnerName}) with employee {EmployeeId} ({EmployeeName}) via email {Email}. Set image to {ImageUrl}",
                                winner.UserId,
                                winner.Name,
                                matchingEmployee.Id,
                                matchingEmployee.Name,
                                harvestUserEmail,
                                matchingEmployee.AvatarImageUrl);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to fetch harvest user email from database for winner {UserId} ({Name})", winner.UserId, winner.Name);
                            // Continue with null image if fetch fails
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Could not parse userId {UserId} as integer for winner {Name}", winner.UserId, winner.Name);
                    }
                }
            }

            // Group winners by week
            var weeklyWinners = winners
                .GroupBy(w => w.Week)
                .Select(g => new WeeklyWinnersDto
                {
                    Week = g.Key,
                    Winners = g.OrderByDescending(w => w.CreatedAt).ToList()
                })
                .OrderByDescending(w => w.Week)
                .ToList();

            var response = new AllWinnersResponse
            {
                WeeklyWinners = weeklyWinners
            };

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
            // Get all unique users with lottery tickets
            var usersWithTickets = await _context.LotteryTickets
                .GroupBy(t => new { t.UserId, t.Name, t.Image })
                .Select(g => new
                {
                    g.Key.UserId,
                    g.Key.Name,
                    g.Key.Image,
                    TicketCount = g.Count()
                })
                .ToListAsync();

            // Get win counts per user
            var winCounts = await _context.WinningTickets
                .GroupBy(wt => wt.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    WinCount = g.Count()
                })
                .ToListAsync();

            // Create a dictionary for quick lookup of win counts
            var winCountDict = winCounts.ToDictionary(w => w.UserId, w => w.WinCount);

            // Map to DTOs
            var employeeStats = usersWithTickets.Select(u => new EmployeeStatisticsDto
            {
                UserId = u.UserId,
                Name = u.Name,
                Image = u.Image,
                TicketCount = u.TicketCount,
                WinCount = winCountDict.GetValueOrDefault(u.UserId, 0)
            })
            .OrderByDescending(e => e.TicketCount)
            .ThenByDescending(e => e.WinCount)
            .ThenBy(e => e.Name)
            .ToList();

            var response = new EmployeeStatisticsResponse
            {
                Employees = employeeStats
            };

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

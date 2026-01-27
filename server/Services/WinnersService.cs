using Fortedle.Server.Data;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Services;

public interface IWinnersService
{
    Task<AllWinnersResponse> GetWinnersAsync();
}

public class WinnersService : IWinnersService
{
    private readonly IWinningTicketRepository _winningTicketRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly AppDbContext _context;
    private readonly ILogger<WinnersService> _logger;

    public WinnersService(
        IWinningTicketRepository winningTicketRepository,
        IEmployeeRepository employeeRepository,
        AppDbContext context,
        ILogger<WinnersService> logger)
    {
        _winningTicketRepository = winningTicketRepository;
        _employeeRepository = employeeRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<AllWinnersResponse> GetWinnersAsync()
    {
        // Query winning tickets joined with lottery tickets to get Name and Image
        var winningTickets = await _winningTicketRepository.GetAllWithLotteryTicketsAsync();
        
        var winners = winningTickets
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
            .ToList();

        // Get all employees for email matching (include all employees with email, even if avatarImageUrl is null)
        var employees = await _employeeRepository.GetAllWithEmailAsync();

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
                        var harvestUserEmail = await GetHarvestUserEmailAsync(harvestUserId);

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

        return new AllWinnersResponse
        {
            WeeklyWinners = weeklyWinners
        };
    }

    /// <summary>
    /// Get harvest user email by harvest user ID from the harvest_users table.
    /// Note: This uses raw SQL because harvest_users is not mapped in EF Core.
    /// Consider creating IHarvestUserRepository for better abstraction.
    /// </summary>
    private async Task<string?> GetHarvestUserEmailAsync(int harvestUserId)
    {
        _logger.LogInformation("Fetching harvest user email for ID {HarvestUserId} from database", harvestUserId);
        
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
            return result?.ToString();
        }
        finally
        {
            if (!wasOpen)
            {
                await connection.CloseAsync();
            }
        }
    }
}

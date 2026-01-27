using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Services;

public interface IGiftcardService
{
    Task<SendGiftcardResponse> SendGiftcardAsync(SendGiftcardRequest request);
    Task<SendGiftcardResponse> SendGiftcardToWinnerAsync(string userId, int amount, string reason, int? winningTicketId = null, int? monthlyWinningTicketId = null, string? customMessage = null);
    Task<SendGiftcardResponse> ClaimWeeklyPrizeAsync(string userId, int winningTicketId);
    Task<List<GiftcardTransactionDto>> GetAllTransactionsAsync();
    Task<List<GiftcardTransactionDto>> GetTransactionsByUserIdAsync(string userId);
    Task<GiftcardTransactionDto?> GetTransactionByIdAsync(int id);
}

public class GiftcardService : IGiftcardService
{
    private readonly IGledeApiService _gledeApiService;
    private readonly IGiftcardTransactionRepository _giftcardRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IWinningTicketRepository _winningTicketRepository;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<GiftcardService> _logger;

    public GiftcardService(
        IGledeApiService gledeApiService,
        IGiftcardTransactionRepository giftcardRepository,
        IEmployeeRepository employeeRepository,
        IWinningTicketRepository winningTicketRepository,
        AppDbContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<GiftcardService> logger)
    {
        _gledeApiService = gledeApiService;
        _giftcardRepository = giftcardRepository;
        _employeeRepository = employeeRepository;
        _winningTicketRepository = winningTicketRepository;
        _context = context;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task<SendGiftcardResponse> SendGiftcardAsync(SendGiftcardRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Attempting to send giftcard to user {UserId}, amount: {Amount}, reason: {Reason}",
                request.UserId,
                request.Amount,
                request.Reason);

            // Get employee details
            var employee = await _employeeRepository.GetByIdAsync(request.UserId);
            if (employee == null)
            {
                _logger.LogWarning("Employee not found: {UserId}", request.UserId);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = $"Employee not found: {request.UserId}"
                };
            }

            // Determine effective phone (request override takes priority)
            var effectivePhone = request.Phone ?? employee.PhoneNumber;
            // Sanitize phone number for Glede API (remove spaces, ensure E.164 format)
            var sanitizedPhone = !string.IsNullOrEmpty(effectivePhone) ? SanitizePhoneNumber(effectivePhone) : null;
            var effectiveEmail = employee.Email;

            // Environment-based delivery preference:
            // - Production: prefer phone (SMS), fallback to email
            // - Development: prefer email, ignore phone (phone only works in production)
            bool usePhone = false;
            if (_environment.IsProduction())
            {
                // Production: use phone if available, otherwise email
                usePhone = !string.IsNullOrEmpty(sanitizedPhone);
            }
            else
            {
                // Development: ignore phone, use email only
                usePhone = false;
                sanitizedPhone = null; // Clear phone in dev to ensure email is used
            }

            // Validate employee has at least one contact method
            if (!usePhone && string.IsNullOrEmpty(effectiveEmail))
            {
                _logger.LogWarning("Employee {UserId} has no email address (phone not used in {Environment})", 
                    request.UserId, _environment.EnvironmentName);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = $"Employee has no email address (phone delivery only works in production)"
                };
            }

            // Validate amount (minimum 50 NOK - typical minimum for gift cards)
            if (request.Amount < 50)
            {
                _logger.LogWarning("Giftcard amount {Amount} is below minimum (50 NOK) for user {UserId}", request.Amount, request.UserId);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = $"Giftcard amount must be at least 50 NOK (provided: {request.Amount} NOK)"
                };
            }

            // Validate recipient name fields (Glede API requires these)
            if (string.IsNullOrWhiteSpace(employee.FirstName) || string.IsNullOrWhiteSpace(employee.Surname))
            {
                _logger.LogWarning("Employee {UserId} has missing name fields (FirstName: {FirstName}, Surname: {Surname})", 
                    request.UserId, employee.FirstName ?? "null", employee.Surname ?? "null");
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = "Employee must have both first name and surname"
                };
            }

            // Create transaction record as pending
            var transaction = new GiftcardTransaction
            {
                UserId = request.UserId,
                EmployeeName = employee.Name,
                EmployeeEmail = effectiveEmail ?? string.Empty,
                EmployeePhone = effectivePhone,
                Amount = request.Amount,
                Currency = "NOK",
                Reason = request.Reason,
                Status = "pending",
                Message = request.Message,
                SenderName = _configuration["Glede:SenderName"] ?? "Fortel",
                CreatedAt = DateTime.UtcNow,
                WinningTicketId = request.WinningTicketId,
                MonthlyWinningTicketId = request.MonthlyWinningTicketId
            };

            transaction = await _giftcardRepository.AddAsync(transaction);

            // Prepare Glede API request
            // Environment-based delivery: phone in production, email in development
            var recipient = new GledeRecipient
            {
                FirstName = employee.FirstName ?? string.Empty,
                LastName = employee.Surname ?? string.Empty,
                PhoneNumber = usePhone ? sanitizedPhone : null,
                Email = usePhone ? null : effectiveEmail
            };

            var gledeRequest = new GledeCreateOrderRequest
            {
                Recipients = new List<GledeRecipient> { recipient },
                Payment = new GledePayment
                {
                    GiftCardAmount = request.Amount
                },
                SenderName = transaction.SenderName ?? "Fortel",
                Message = request.Message ?? GetDefaultMessage(request.Reason)
            };

            var deliveryMethod = usePhone ? "SMS" : "Email";
            var deliveryTarget = usePhone ? sanitizedPhone : effectiveEmail;
            _logger.LogInformation(
                "Prepared Glede request: Environment={Environment}, Recipient={FirstName} {LastName}, Delivery={DeliveryMethod} ({DeliveryTarget}), Amount={Amount}, Sender={SenderName}",
                _environment.EnvironmentName,
                recipient.FirstName,
                recipient.LastName,
                deliveryMethod,
                deliveryTarget,
                gledeRequest.Payment.GiftCardAmount,
                gledeRequest.SenderName);

            // Call Glede API
            try
            {
                var gledeResponse = await _gledeApiService.CreateOrderAsync(gledeRequest);

                // Update transaction with success
                transaction.Status = "sent";
                transaction.GledeOrderId = gledeResponse.OrderId;
                transaction.SentAt = DateTime.UtcNow;

                // If gifts are available in response, save the first one
                if (gledeResponse.Gifts.Count > 0)
                {
                    var gift = gledeResponse.Gifts[0];
                    transaction.GledeGiftId = gift.Id;
                    transaction.GledeGiftLink = gift.Link;
                }

                await _giftcardRepository.UpdateAsync(transaction);

                _logger.LogInformation(
                    "Giftcard sent successfully to {UserId}. Order ID: {OrderId}",
                    request.UserId,
                    gledeResponse.OrderId);

                return new SendGiftcardResponse
                {
                    Success = true,
                    OrderId = gledeResponse.OrderId,
                    GiftId = transaction.GledeGiftId,
                    GiftLink = transaction.GledeGiftLink
                };
            }
            catch (Exception ex)
            {
                // Update transaction with failure
                transaction.Status = "failed";
                transaction.ErrorMessage = ex.Message;
                await _giftcardRepository.UpdateAsync(transaction);

                _logger.LogError(ex, "Failed to send giftcard via Glede API for user {UserId}", request.UserId);

                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while sending giftcard to user {UserId}", request.UserId);
            return new SendGiftcardResponse
            {
                Success = false,
                ErrorMessage = $"Unexpected error: {ex.Message}"
            };
        }
    }

    public async Task<SendGiftcardResponse> SendGiftcardToWinnerAsync(
        string userId,
        int amount,
        string reason,
        int? winningTicketId = null,
        int? monthlyWinningTicketId = null,
        string? customMessage = null)
    {
        return await SendGiftcardAsync(new SendGiftcardRequest
        {
            UserId = userId,
            Amount = amount,
            Reason = reason,
            Message = customMessage,
            WinningTicketId = winningTicketId,
            MonthlyWinningTicketId = monthlyWinningTicketId
        });
    }

    public async Task<SendGiftcardResponse> ClaimWeeklyPrizeAsync(string userId, int winningTicketId)
    {
        try
        {
            _logger.LogInformation(
                "Attempting to claim weekly prize for user {UserId}, WinningTicketId: {WinningTicketId}",
                userId,
                winningTicketId);

            // Verify the winning ticket exists and belongs to the user
            var winningTicket = await _winningTicketRepository.GetByIdAsync(winningTicketId);
            if (winningTicket == null)
            {
                _logger.LogWarning("Winning ticket {WinningTicketId} not found", winningTicketId);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = $"Winning ticket {winningTicketId} not found"
                };
            }

            if (winningTicket.UserId != userId)
            {
                _logger.LogWarning(
                    "User {UserId} attempted to claim prize for winning ticket {WinningTicketId} owned by {OwnerUserId}",
                    userId,
                    winningTicketId,
                    winningTicket.UserId);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = "You do not own this winning ticket"
                };
            }

            // Check if prize has already been claimed
            var existingTransaction = await _giftcardRepository.GetByWinningTicketIdAsync(winningTicketId);
            if (existingTransaction != null)
            {
                _logger.LogWarning(
                    "Prize already claimed for winning ticket {WinningTicketId}. Transaction ID: {TransactionId}",
                    winningTicketId,
                    existingTransaction.Id);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = "Prize has already been claimed for this winning ticket"
                };
            }

            // Convert Harvest user ID to Huma employee ID
            // The userId parameter is a Harvest user ID, but employees use Huma IDs
            // We need to look up the employee by email from harvest_users table
            string? employeeId = null;
            if (int.TryParse(userId, out var harvestUserId))
            {
                try
                {
                    // Get email from harvest_users table
                    var dbConnection = _context.Database.GetDbConnection();
                    var wasOpen = dbConnection.State == System.Data.ConnectionState.Open;
                    
                    if (!wasOpen)
                    {
                        await dbConnection.OpenAsync();
                    }
                    
                    try
                    {
                        using var command = dbConnection.CreateCommand();
                        command.CommandText = "SELECT email FROM harvest_users WHERE harvest_user_id = @userId LIMIT 1";
                        var parameter = command.CreateParameter();
                        parameter.ParameterName = "@userId";
                        parameter.Value = harvestUserId;
                        command.Parameters.Add(parameter);
                        
                        var result = await command.ExecuteScalarAsync();
                        var harvestUserEmail = result?.ToString();
                        
                        if (!string.IsNullOrEmpty(harvestUserEmail))
                        {
                            // Find employee by email
                            var allEmployees = await _employeeRepository.GetAllAsync();
                            var matchingEmployee = allEmployees.FirstOrDefault(e =>
                                !string.IsNullOrEmpty(e.Email) &&
                                e.Email.Equals(harvestUserEmail, StringComparison.OrdinalIgnoreCase));
                            
                            if (matchingEmployee != null)
                            {
                                employeeId = matchingEmployee.Id;
                                _logger.LogInformation(
                                    "Mapped Harvest user ID {HarvestUserId} to employee ID {EmployeeId} via email {Email}",
                                    harvestUserId,
                                    employeeId,
                                    harvestUserEmail);
                            }
                            else
                            {
                                _logger.LogWarning(
                                    "No employee found with email {Email} for Harvest user ID {HarvestUserId}",
                                    harvestUserEmail,
                                    harvestUserId);
                            }
                        }
                        else
                        {
                            _logger.LogWarning(
                                "No email found in harvest_users table for Harvest user ID {HarvestUserId}",
                                harvestUserId);
                        }
                    }
                    finally
                    {
                        if (!wasOpen)
                        {
                            await dbConnection.CloseAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error mapping Harvest user ID {HarvestUserId} to employee ID", harvestUserId);
                }
            }
            
            if (string.IsNullOrEmpty(employeeId))
            {
                _logger.LogWarning("Could not map Harvest user ID {UserId} to employee ID", userId);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = $"Could not find employee for user {userId}"
                };
            }

            // Get the weekly winner amount from configuration
            var weeklyWinnerAmount = _configuration.GetValue<int>("Glede:WeeklyWinnerAmount", 1);

            // Send the giftcard using the Huma employee ID
            return await SendGiftcardToWinnerAsync(
                employeeId,
                weeklyWinnerAmount,
                "weekly_lottery_winner",
                winningTicketId: winningTicketId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error claiming weekly prize for user {UserId}, WinningTicketId: {WinningTicketId}", userId, winningTicketId);
            return new SendGiftcardResponse
            {
                Success = false,
                ErrorMessage = $"Unexpected error: {ex.Message}"
            };
        }
    }

    public async Task<List<GiftcardTransactionDto>> GetAllTransactionsAsync()
    {
        var transactions = await _giftcardRepository.GetAllAsync();
        return transactions.Select(t => t.ToDto()).ToList();
    }

    public async Task<List<GiftcardTransactionDto>> GetTransactionsByUserIdAsync(string userId)
    {
        var transactions = await _giftcardRepository.GetByUserIdAsync(userId);
        return transactions.Select(t => t.ToDto()).ToList();
    }

    public async Task<GiftcardTransactionDto?> GetTransactionByIdAsync(int id)
    {
        var transaction = await _giftcardRepository.GetByIdAsync(id);
        return transaction?.ToDto();
    }

    private string GetDefaultMessage(string reason)
    {
        return reason switch
        {
            "weekly_lottery_winner" => "Gratulerer med seier i ukeslotteriet! 🎉 Bruk gavekortetet til noe gøy!",
            "monthly_lottery_winner" => "Gratulerer med seier i månedens lotteri! 🏆 Du har vært en av de mest produktive denne måneden!",
            "manual" => "Gratulerer! Her er et gavekort fra Fortel! 🎁",
            _ => "Gratulerer! Her er et gavekort fra Fortel! 🎁"
        };
    }

    /// <summary>
    /// Sanitizes phone number for Glede API by removing spaces and formatting characters.
    /// Ensures E.164 format (e.g., +47479040001 instead of +47 479 04 001).
    /// </summary>
    private static string? SanitizePhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return null;

        // Remove all spaces, dashes, parentheses, and other formatting characters
        var sanitized = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"[\s\-\(\)\.]", "");

        // Ensure it starts with + for international format
        if (!sanitized.StartsWith("+"))
        {
            // If it doesn't start with +, try to preserve the original format
            // but remove spaces and formatting
            return sanitized;
        }

        return sanitized;
    }
}

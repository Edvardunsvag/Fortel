using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface IGiftcardService
{
    Task<SendGiftcardResponse> SendGiftcardAsync(SendGiftcardRequest request);
    Task<SendGiftcardResponse> SendGiftcardToWinnerAsync(string userId, int amount, string reason, int? winningTicketId = null, int? monthlyWinningTicketId = null, string? customMessage = null);
    Task<List<GiftcardTransactionDto>> GetAllTransactionsAsync();
    Task<List<GiftcardTransactionDto>> GetTransactionsByUserIdAsync(string userId);
    Task<GiftcardTransactionDto?> GetTransactionByIdAsync(int id);
}

public class GiftcardService : IGiftcardService
{
    private readonly IGledeApiService _gledeApiService;
    private readonly IGiftcardTransactionRepository _giftcardRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GiftcardService> _logger;

    public GiftcardService(
        IGledeApiService gledeApiService,
        IGiftcardTransactionRepository giftcardRepository,
        IEmployeeRepository employeeRepository,
        IConfiguration configuration,
        ILogger<GiftcardService> logger)
    {
        _gledeApiService = gledeApiService;
        _giftcardRepository = giftcardRepository;
        _employeeRepository = employeeRepository;
        _configuration = configuration;
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

            // Validate employee has required contact information
            if (string.IsNullOrEmpty(employee.Email))
            {
                _logger.LogWarning("Employee {UserId} has no email address", request.UserId);
                return new SendGiftcardResponse
                {
                    Success = false,
                    ErrorMessage = "Employee has no email address"
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
                EmployeeEmail = employee.Email,
                EmployeePhone = null, // Glede primarily uses email
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
            var gledeRequest = new GledeCreateOrderRequest
            {
                Recipients = new List<GledeRecipient>
                {
                    new GledeRecipient
                    {
                        FirstName = employee.FirstName ?? string.Empty,
                        LastName = employee.Surname ?? string.Empty,
                        Email = employee.Email
                    }
                },
                Payment = new GledePayment
                {
                    GiftCardAmount = request.Amount
                },
                SenderName = transaction.SenderName ?? "Fortel",
                Message = request.Message ?? GetDefaultMessage(request.Reason)
            };

            _logger.LogInformation(
                "Prepared Glede request: Recipient={FirstName} {LastName} ({Email}), Amount={Amount}, Sender={SenderName}",
                gledeRequest.Recipients[0].FirstName,
                gledeRequest.Recipients[0].LastName,
                gledeRequest.Recipients[0].Email,
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
}

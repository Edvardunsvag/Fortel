using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Fortedle.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GiftcardsController : ControllerBase
{
    private readonly IGiftcardService _giftcardService;
    private readonly ILogger<GiftcardsController> _logger;

    public GiftcardsController(
        IGiftcardService giftcardService,
        ILogger<GiftcardsController> logger)
    {
        _giftcardService = giftcardService;
        _logger = logger;
    }

    /// <summary>
    /// Send a giftcard to a user
    /// </summary>
    [HttpPost("send")]
    public async Task<ActionResult<SendGiftcardResponse>> SendGiftcard([FromBody] SendGiftcardRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new { error = "amount must be greater than 0" });
            }

            if (request.Amount > 10000)
            {
                return BadRequest(new { error = "amount cannot exceed 10,000 NOK" });
            }

            var response = await _giftcardService.SendGiftcardAsync(request);

            if (!response.Success)
            {
                return BadRequest(new { error = response.ErrorMessage });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending giftcard to user {UserId}", request.UserId);
            return StatusCode(500, new { error = "An error occurred while sending the giftcard", details = ex.Message });
        }
    }

    /// <summary>
    /// Get all giftcard transactions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<GiftcardTransactionDto>>> GetAllTransactions()
    {
        try
        {
            var transactions = await _giftcardService.GetAllTransactionsAsync();
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all giftcard transactions");
            return StatusCode(500, new { error = "An error occurred while fetching transactions", details = ex.Message });
        }
    }

    /// <summary>
    /// Get giftcard transactions for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<GiftcardTransactionDto>>> GetTransactionsByUserId(string userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { error = "userId is required" });
            }

            var transactions = await _giftcardService.GetTransactionsByUserIdAsync(userId);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching giftcard transactions for user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while fetching transactions", details = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific giftcard transaction by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<GiftcardTransactionDto>> GetTransactionById(int id)
    {
        try
        {
            var transaction = await _giftcardService.GetTransactionByIdAsync(id);

            if (transaction == null)
            {
                return NotFound(new { error = $"Transaction with ID {id} not found" });
            }

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching giftcard transaction {TransactionId}", id);
            return StatusCode(500, new { error = "An error occurred while fetching the transaction", details = ex.Message });
        }
    }
}

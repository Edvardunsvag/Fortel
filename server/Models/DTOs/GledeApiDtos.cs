using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.DTOs;

// Request DTOs
public class GledeCreateOrderRequest
{
    [JsonPropertyName("recipients")]
    public List<GledeRecipient> Recipients { get; set; } = new();

    [JsonPropertyName("payment")]
    public GledePayment Payment { get; set; } = new();

    [JsonPropertyName("senderName")]
    public string? SenderName { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("templateId")]
    public string? TemplateId { get; set; }

    [JsonPropertyName("scheduledSendingTime")]
    public long? ScheduledSendingTime { get; set; }
}

public class GledeRecipient
{
    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }
}

public class GledePayment
{
    [JsonPropertyName("giftCardAmount")]
    public int GiftCardAmount { get; set; }

    [JsonPropertyName("invoiceEmail")]
    public string? InvoiceEmail { get; set; }

    [JsonPropertyName("invoiceReference")]
    public string? InvoiceReference { get; set; }
}

// Response DTOs
public class GledeCreateOrderResponse
{
    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("gifts")]
    public List<GledeGift> Gifts { get; set; } = new();
}

public class GledeGift
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("link")]
    public string Link { get; set; } = string.Empty;
}

public class GledeErrorResponse
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("statusCode")]
    public int? StatusCode { get; set; }
}

// Application DTOs
public class SendGiftcardRequest
{
    public string UserId { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string? Message { get; set; }
    public string Reason { get; set; } = "manual";
    public string? Phone { get; set; }
    public int? WinningTicketId { get; set; }
    public int? MonthlyWinningTicketId { get; set; }
}

public class SendGiftcardResponse
{
    public bool Success { get; set; }
    public string? OrderId { get; set; }
    public string? GiftId { get; set; }
    public string? GiftLink { get; set; }
    public string? ErrorMessage { get; set; }
}

public class GiftcardTransactionDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeEmail { get; set; } = string.Empty;
    public string? EmployeePhone { get; set; }
    public int Amount { get; set; }
    public string Currency { get; set; } = "NOK";
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? GledeOrderId { get; set; }
    public string? GledeGiftId { get; set; }
    public string? GledeGiftLink { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Message { get; set; }
    public string? SenderName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public int? WinningTicketId { get; set; }
    public int? MonthlyWinningTicketId { get; set; }
}

using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class GiftcardTransactionMappings
{
    public static GiftcardTransactionDto ToDto(this GiftcardTransaction transaction)
    {
        return new GiftcardTransactionDto
        {
            Id = transaction.Id,
            UserId = transaction.UserId,
            EmployeeName = transaction.EmployeeName,
            EmployeeEmail = transaction.EmployeeEmail,
            EmployeePhone = transaction.EmployeePhone,
            Amount = transaction.Amount,
            Currency = transaction.Currency,
            Reason = transaction.Reason,
            Status = transaction.Status,
            GledeOrderId = transaction.GledeOrderId,
            GledeGiftId = transaction.GledeGiftId,
            GledeGiftLink = transaction.GledeGiftLink,
            ErrorMessage = transaction.ErrorMessage,
            Message = transaction.Message,
            SenderName = transaction.SenderName,
            CreatedAt = transaction.CreatedAt,
            SentAt = transaction.SentAt,
            WinningTicketId = transaction.WinningTicketId,
            MonthlyWinningTicketId = transaction.MonthlyWinningTicketId
        };
    }
}

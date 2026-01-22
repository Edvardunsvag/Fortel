using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class WinningTicketExtensions
{
    public static WinnerDto ToDto(this WinningTicket entity)
    {
        return new WinnerDto
        {
            UserId = entity.UserId,
            Name = entity.LotteryTicket?.Name ?? string.Empty,
            Image = entity.LotteryTicket?.Image,
            Week = entity.Week,
            CreatedAt = entity.CreatedAt,
            WinningTicketId = entity.Id,
            PrizeClaimed = false // Will be set by service layer after checking transaction
        };
    }
}

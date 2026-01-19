using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class MonthlyWinningTicketExtensions
{
    public static MonthlyWinnerDto ToDto(this MonthlyWinningTicket entity)
    {
        return new MonthlyWinnerDto
        {
            UserId = entity.UserId,
            Name = entity.Name,
            Image = entity.Image,
            Color = entity.Color,
            Month = entity.Month,
            Position = entity.Position,
            TicketsConsumed = entity.TicketsConsumed,
            CreatedAt = entity.CreatedAt,
        };
    }
}

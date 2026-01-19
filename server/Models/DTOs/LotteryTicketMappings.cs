using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class LotteryTicketExtensions
{
    public static LotteryTicketDto ToDto(this LotteryTicket entity)
    {
        return new LotteryTicketDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Name = entity.Name,
            Image = entity.Image,
            EligibleWeek = entity.EligibleWeek,
            IsUsed = entity.IsUsed,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}

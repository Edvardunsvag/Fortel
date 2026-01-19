using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class LeaderboardEntryExtensions
{
    public static LeaderboardEntryDto ToDto(this LeaderboardEntry entity, int rank)
    {
        return new LeaderboardEntryDto
        {
            Rank = rank,
            Name = entity.PlayerName,
            Score = entity.Score,
            AvatarImageUrl = entity.AvatarImageUrl,
            SubmittedAt = entity.CreatedAt,
        };
    }
}

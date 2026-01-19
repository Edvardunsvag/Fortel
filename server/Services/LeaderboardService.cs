using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface ILeaderboardService
{
    Task<LeaderboardDto> GetLeaderboardAsync(string? date = null);
    Task<SubmitScoreResponse> SubmitScoreAsync(SubmitScoreRequest request);
}

public class LeaderboardService : ILeaderboardService
{
    private readonly ILeaderboardRepository _leaderboardRepository;
    private readonly ILogger<LeaderboardService> _logger;

    public LeaderboardService(
        ILeaderboardRepository leaderboardRepository,
        ILogger<LeaderboardService> logger)
    {
        _leaderboardRepository = leaderboardRepository;
        _logger = logger;
    }

    public async Task<LeaderboardDto> GetLeaderboardAsync(string? date = null)
    {
        var targetDate = date != null 
            ? DateOnly.Parse(date) 
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var entries = await _leaderboardRepository.GetByDateAsync(targetDate);

        var leaderboard = entries.Select((entry, index) => entry.ToDto(index + 1)).ToList();

        return new LeaderboardDto
        {
            Date = targetDate.ToString("yyyy-MM-dd"),
            Leaderboard = leaderboard,
        };
    }

    public async Task<SubmitScoreResponse> SubmitScoreAsync(SubmitScoreRequest request)
    {
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        var playerName = request.Name.Trim();

        // Check if entry already exists
        var existingEntry = await _leaderboardRepository.GetByPlayerNameAndDateAsync(playerName, date);

        if (existingEntry != null)
        {
            // Update if new score is better (lower)
            if (request.Score < existingEntry.Score)
            {
                existingEntry.Score = request.Score;
                existingEntry.AvatarImageUrl = request.AvatarImageUrl ?? existingEntry.AvatarImageUrl;
                existingEntry.CreatedAt = DateTime.UtcNow;
            }
            else
            {
                // Keep existing score, but update avatar if provided
                existingEntry.AvatarImageUrl = request.AvatarImageUrl ?? existingEntry.AvatarImageUrl;
            }

            await _leaderboardRepository.UpdateAsync(existingEntry);

            return new SubmitScoreResponse
            {
                Success = true,
                Result = existingEntry.ToDto(0), // Rank will be recalculated on next fetch
            };
        }

        // Create new entry
        var newEntry = new Models.Database.LeaderboardEntry
        {
            PlayerName = playerName,
            Score = request.Score,
            Date = date,
            AvatarImageUrl = request.AvatarImageUrl,
            CreatedAt = DateTime.UtcNow,
        };

        var createdEntry = await _leaderboardRepository.AddAsync(newEntry);

        return new SubmitScoreResponse
        {
            Success = true,
            Result = createdEntry.ToDto(0), // Rank will be recalculated on next fetch
        };
    }
}

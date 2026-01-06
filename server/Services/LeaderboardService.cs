using Fortedle.Server.Data;
using Fortedle.Server.Data.Entities;
using Fortedle.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Services;

public interface ILeaderboardService
{
    Task<LeaderboardDto> GetLeaderboardAsync(string? date = null);
    Task<SubmitScoreResponse> SubmitScoreAsync(SubmitScoreRequest request);
}

public class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext _context;

    public LeaderboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LeaderboardDto> GetLeaderboardAsync(string? date = null)
    {
        var targetDate = date != null 
            ? DateOnly.Parse(date) 
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var entries = await _context.LeaderboardEntries
            .Where(e => e.Date == targetDate)
            .OrderBy(e => e.Score)
            .ThenBy(e => e.CreatedAt)
            .Take(100)
            .ToListAsync();

        var leaderboard = entries.Select((entry, index) => new LeaderboardEntryDto
        {
            Rank = index + 1,
            Name = entry.PlayerName,
            Score = entry.Score,
            AvatarImageUrl = entry.AvatarImageUrl,
            SubmittedAt = entry.CreatedAt,
        }).ToList();

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
        var existingEntry = await _context.LeaderboardEntries
            .FirstOrDefaultAsync(e => e.PlayerName == playerName && e.Date == date);

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

            await _context.SaveChangesAsync();

            return new SubmitScoreResponse
            {
                Success = true,
                Result = new LeaderboardEntryDto
                {
                    Name = existingEntry.PlayerName,
                    Score = existingEntry.Score,
                    AvatarImageUrl = existingEntry.AvatarImageUrl,
                    SubmittedAt = existingEntry.CreatedAt,
                },
            };
        }

        // Create new entry
        var newEntry = new LeaderboardEntry
        {
            PlayerName = playerName,
            Score = request.Score,
            Date = date,
            AvatarImageUrl = request.AvatarImageUrl,
            CreatedAt = DateTime.UtcNow,
        };

        _context.LeaderboardEntries.Add(newEntry);
        await _context.SaveChangesAsync();

        return new SubmitScoreResponse
        {
            Success = true,
            Result = new LeaderboardEntryDto
            {
                Name = newEntry.PlayerName,
                Score = newEntry.Score,
                AvatarImageUrl = newEntry.AvatarImageUrl,
                SubmittedAt = newEntry.CreatedAt,
            },
        };
    }
}


namespace Fortedle.Server.Models;

public class LeaderboardDto
{
    public string Date { get; set; } = string.Empty;
    public List<LeaderboardEntryDto> Leaderboard { get; set; } = new();
}

public class LeaderboardEntryDto
{
    public int Rank { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? AvatarImageUrl { get; set; }
    public DateTime SubmittedAt { get; set; }
}

public class SubmitScoreRequest
{
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? AvatarImageUrl { get; set; }
}

public class SubmitScoreResponse
{
    public bool Success { get; set; }
    public LeaderboardEntryDto Result { get; set; } = new();
}


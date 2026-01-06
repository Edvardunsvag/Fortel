namespace Fortedle.Server.Models;

public class RoundDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? EmployeeOfTheDayId { get; set; }
    public List<GuessDto> Guesses { get; set; } = new();
    public bool FunfactRevealed { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}

public class GuessDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? AvatarImageUrl { get; set; }
    public List<GuessHintDto> Hints { get; set; } = new();
    public bool IsCorrect { get; set; }
}

public class GuessHintDto
{
    public string Type { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class StartRoundRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? Date { get; set; }
    public string? EmployeeOfTheDayId { get; set; }
}

public class SaveGuessRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? Date { get; set; }
    public GuessDto Guess { get; set; } = new();
    public bool? FunfactRevealed { get; set; }
}

public class FinishRoundRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? Date { get; set; }
    public string Status { get; set; } = string.Empty; // "won" or "lost"
}


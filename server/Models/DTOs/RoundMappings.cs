using Fortedle.Server.Models.Database;
using System.Text.Json;

namespace Fortedle.Server.Models.DTOs;

public static class RoundExtensions
{
    public static RoundDto ToDto(this Round entity)
    {
        var guesses = JsonSerializer.Deserialize<List<GuessDto>>(entity.GuessesJson) ?? new List<GuessDto>();

        return new RoundDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Date = entity.Date.ToString("yyyy-MM-dd"),
            Status = entity.Status,
            EmployeeOfTheDayId = entity.EmployeeOfTheDayId,
            Guesses = guesses,
            FunfactRevealed = entity.FunfactRevealed,
            StartedAt = entity.StartedAt,
            FinishedAt = entity.FinishedAt,
        };
    }
}

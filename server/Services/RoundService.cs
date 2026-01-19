using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;
using System.Text.Json;

namespace Fortedle.Server.Services;

public interface IRoundService
{
    Task<RoundDto?> GetCurrentRoundAsync(string userId, string? date = null);
    Task<RoundDto> StartRoundAsync(StartRoundRequest request);
    Task<RoundDto> SaveGuessAsync(SaveGuessRequest request);
    Task<RoundDto> RevealFunfactAsync(RevealFunfactRequest request);
}

public class RoundService : IRoundService
{
    private readonly IRoundRepository _roundRepository;
    private readonly ILogger<RoundService> _logger;

    public RoundService(
        IRoundRepository roundRepository,
        ILogger<RoundService> logger)
    {
        _roundRepository = roundRepository;
        _logger = logger;
    }

    public async Task<RoundDto?> GetCurrentRoundAsync(string userId, string? date = null)
    {
        var targetDate = date != null
            ? DateOnly.Parse(date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var round = await _roundRepository.GetByUserIdAndDateAsync(userId, targetDate);

        if (round == null)
        {
            return null;
        }

        return round.ToDto();
    }

    public async Task<RoundDto> StartRoundAsync(StartRoundRequest request)
    {
        var date = request.Date != null
            ? DateOnly.Parse(request.Date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        // Check if round already exists
        var existingRound = await _roundRepository.GetByUserIdAndDateAsync(request.UserId, date);

        if (existingRound != null)
        {
            // Return existing round instead of creating new one
            return existingRound.ToDto();
        }

        var round = new Round
        {
            UserId = request.UserId,
            Date = date,
            Status = "started",
            EmployeeOfTheDayId = request.EmployeeOfTheDayId,
            GuessesJson = "[]",
            FunfactRevealed = false,
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var createdRound = await _roundRepository.AddAsync(round);
        return createdRound.ToDto();
    }

    public async Task<RoundDto> SaveGuessAsync(SaveGuessRequest request)
    {
        var date = request.Date != null
            ? DateOnly.Parse(request.Date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var round = await _roundRepository.GetByUserIdAndDateAsync(request.UserId, date);

        if (round == null)
        {
            throw new InvalidOperationException($"No round found for user {request.UserId} on date {date}");
        }

        // Parse existing guesses
        var guesses = JsonSerializer.Deserialize<List<GuessDto>>(round.GuessesJson) ?? new List<GuessDto>();

        // Add new guess
        guesses.Add(request.Guess);

        // Update round
        round.GuessesJson = JsonSerializer.Serialize(guesses);
        
        // Update status if game is won
        if (request.Guess.IsCorrect)
        {
            round.Status = "won";
            round.FinishedAt = DateTime.UtcNow;
        }

        round.UpdatedAt = DateTime.UtcNow;
        await _roundRepository.UpdateAsync(round);

        return round.ToDto();
    }

    public async Task<RoundDto> RevealFunfactAsync(RevealFunfactRequest request)
    {
        var round = await _roundRepository.GetByIdAsync(request.RoundId);

        if (round == null)
        {
            throw new InvalidOperationException($"No round found with ID {request.RoundId}");
        }

        // Update only the FunfactRevealed flag
        round.FunfactRevealed = true;
        round.UpdatedAt = DateTime.UtcNow;
        await _roundRepository.UpdateAsync(round);

        return round.ToDto();
    }
}

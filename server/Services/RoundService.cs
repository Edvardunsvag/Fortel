using Fortedle.Server.Data;
using Fortedle.Server.Data.Entities;
using Fortedle.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fortedle.Server.Services;

public interface IRoundService
{
    Task<RoundDto?> GetCurrentRoundAsync(string userId, string? date = null);
    Task<RoundDto> StartRoundAsync(StartRoundRequest request);
    Task<RoundDto> SaveGuessAsync(SaveGuessRequest request);
    Task<RoundDto> FinishRoundAsync(FinishRoundRequest request);
}

public class RoundService : IRoundService
{
    private readonly AppDbContext _context;
    private readonly ILogger<RoundService> _logger;

    public RoundService(AppDbContext context, ILogger<RoundService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<RoundDto?> GetCurrentRoundAsync(string userId, string? date = null)
    {
        var targetDate = date != null
            ? DateOnly.Parse(date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var round = await _context.Rounds
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Date == targetDate);

        if (round == null)
        {
            return null;
        }

        return MapToDto(round);
    }

    public async Task<RoundDto> StartRoundAsync(StartRoundRequest request)
    {
        var date = request.Date != null
            ? DateOnly.Parse(request.Date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        // Check if round already exists
        var existingRound = await _context.Rounds
            .FirstOrDefaultAsync(r => r.UserId == request.UserId && r.Date == date);

        if (existingRound != null)
        {
            // Return existing round instead of creating new one
            return MapToDto(existingRound);
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

        _context.Rounds.Add(round);
        await _context.SaveChangesAsync();

        return MapToDto(round);
    }

    public async Task<RoundDto> SaveGuessAsync(SaveGuessRequest request)
    {
        var date = request.Date != null
            ? DateOnly.Parse(request.Date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var round = await _context.Rounds
            .FirstOrDefaultAsync(r => r.UserId == request.UserId && r.Date == date);

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
        round.FunfactRevealed = request.FunfactRevealed ?? round.FunfactRevealed;
        
        // Update status if game is won
        if (request.Guess.IsCorrect)
        {
            round.Status = "won";
            round.FinishedAt = DateTime.UtcNow;
        }

        round.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(round);
    }

    public async Task<RoundDto> FinishRoundAsync(FinishRoundRequest request)
    {
        var date = request.Date != null
            ? DateOnly.Parse(request.Date)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var round = await _context.Rounds
            .FirstOrDefaultAsync(r => r.UserId == request.UserId && r.Date == date);

        if (round == null)
        {
            throw new InvalidOperationException($"No round found for user {request.UserId} on date {date}");
        }

        round.Status = request.Status; // "won" or "lost"
        round.FinishedAt = DateTime.UtcNow;
        round.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(round);
    }

    private static RoundDto MapToDto(Round round)
    {
        var guesses = JsonSerializer.Deserialize<List<GuessDto>>(round.GuessesJson) ?? new List<GuessDto>();

        return new RoundDto
        {
            Id = round.Id,
            UserId = round.UserId,
            Date = round.Date.ToString("yyyy-MM-dd"),
            Status = round.Status,
            EmployeeOfTheDayId = round.EmployeeOfTheDayId,
            Guesses = guesses,
            FunfactRevealed = round.FunfactRevealed,
            StartedAt = round.StartedAt,
            FinishedAt = round.FinishedAt,
        };
    }
}


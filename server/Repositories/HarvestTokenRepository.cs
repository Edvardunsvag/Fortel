using Fortedle.Server.Data;
using Fortedle.Server.Models.Database;
using Fortedle.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Repositories;

public interface IHarvestTokenRepository
{
    Task<HarvestToken?> GetByUserIdAsync(string userId);
    Task<HarvestToken> UpsertAsync(HarvestToken token);
    Task DeleteByUserIdAsync(string userId);
    Task<bool> ExistsAsync(string userId);
}

public class HarvestTokenRepository : IHarvestTokenRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<HarvestTokenRepository> _logger;
    private readonly ITokenEncryptionService _encryptionService;

    public HarvestTokenRepository(
        AppDbContext context, 
        ILogger<HarvestTokenRepository> logger,
        ITokenEncryptionService encryptionService)
    {
        _context = context;
        _logger = logger;
        _encryptionService = encryptionService;
    }

    public async Task<HarvestToken?> GetByUserIdAsync(string userId)
    {
        // Use AsNoTracking to prevent EF Core from tracking changes when we decrypt
        var token = await _context.HarvestTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (token == null)
        {
            return null;
        }

        // Decrypt tokens before returning
        try
        {
            // Try to decrypt - if it fails, assume token is not encrypted (migration scenario)
            var decryptedAccessToken = _encryptionService.TryDecrypt(token.AccessToken);
            var decryptedRefreshToken = _encryptionService.TryDecrypt(token.RefreshToken);

            if (decryptedAccessToken != null)
            {
                token.AccessToken = decryptedAccessToken;
            }
            else
            {
                // Token is not encrypted yet - encrypt it now for future storage
                _logger.LogInformation("Found unencrypted access token for user {UserId}, will encrypt on next save", userId);
            }

            if (decryptedRefreshToken != null)
            {
                token.RefreshToken = decryptedRefreshToken;
            }
            else
            {
                // Token is not encrypted yet - encrypt it now for future storage
                _logger.LogInformation("Found unencrypted refresh token for user {UserId}, will encrypt on next save", userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decrypting tokens for user {UserId}", userId);
            // Return token as-is if decryption fails (shouldn't happen, but be defensive)
        }

        return token;
    }

    public async Task<HarvestToken> UpsertAsync(HarvestToken token)
    {
        // Encrypt tokens before saving to database
        _logger.LogDebug("Encrypting tokens for user {UserId}", token.UserId);
        var encryptedAccessToken = _encryptionService.Encrypt(token.AccessToken);
        var encryptedRefreshToken = _encryptionService.Encrypt(token.RefreshToken);
        _logger.LogDebug("Encrypted tokens. Access token encrypted length: {AccessLength}, Refresh token encrypted length: {RefreshLength}", 
            encryptedAccessToken.Length, encryptedRefreshToken.Length);

        // Detach any tracked entity first to ensure we get fresh data from database
        var trackedEntity = _context.ChangeTracker.Entries<HarvestToken>()
            .FirstOrDefault(e => e.Entity.UserId == token.UserId);
        if (trackedEntity != null)
        {
            trackedEntity.State = EntityState.Detached;
        }

        // Query for existing token with AsNoTracking to get fresh data
        var existing = await _context.HarvestTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == token.UserId);

        if (existing != null)
        {
            // Update existing token with encrypted values
            // Attach the existing entity and mark it for update
            _context.HarvestTokens.Attach(existing);
            existing.AccessToken = encryptedAccessToken;
            existing.RefreshToken = encryptedRefreshToken;
            existing.ExpiresAt = token.ExpiresAt;
            existing.AccountId = token.AccountId;
            existing.UpdatedAt = DateTime.UtcNow;
            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            _logger.LogDebug("Updated existing token with encrypted values for user {UserId}", token.UserId);

            // Return decrypted token for use in application
            existing.AccessToken = token.AccessToken;
            existing.RefreshToken = token.RefreshToken;
            return existing;
        }
        else
        {
            // Add new token with encrypted values
            var tokenToSave = new HarvestToken
            {
                UserId = token.UserId,
                AccessToken = encryptedAccessToken,
                RefreshToken = encryptedRefreshToken,
                ExpiresAt = token.ExpiresAt,
                AccountId = token.AccountId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.HarvestTokens.Add(tokenToSave);
            await _context.SaveChangesAsync();

            // Return decrypted token for use in application
            tokenToSave.AccessToken = token.AccessToken;
            tokenToSave.RefreshToken = token.RefreshToken;
            return tokenToSave;
        }
    }

    public async Task DeleteByUserIdAsync(string userId)
    {
        var token = await _context.HarvestTokens
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (token != null)
        {
            _context.HarvestTokens.Remove(token);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string userId)
    {
        return await _context.HarvestTokens
            .AnyAsync(t => t.UserId == userId);
    }
}

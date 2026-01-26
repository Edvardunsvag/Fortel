using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Fortedle.Server.Services;

/// <summary>
/// Service for encrypting and decrypting sensitive tokens at rest using ASP.NET Core Data Protection
/// </summary>
public class TokenEncryptionService : ITokenEncryptionService
{
    private readonly IDataProtector _protector;
    private readonly ILogger<TokenEncryptionService> _logger;

    public TokenEncryptionService(
        IDataProtectionProvider dataProtectionProvider,
        ILogger<TokenEncryptionService> logger)
    {
        // Create a protector with a specific purpose string for Harvest tokens
        _protector = dataProtectionProvider.CreateProtector("Fortedle.HarvestTokens");
        _logger = logger;
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return plainText;
        }

        try
        {
            var encryptedBytes = _protector.Protect(System.Text.Encoding.UTF8.GetBytes(plainText));
            return Convert.ToBase64String(encryptedBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt token");
            throw new InvalidOperationException("Failed to encrypt token", ex);
        }
    }

    public string Decrypt(string encryptedText)
    {
        if (string.IsNullOrEmpty(encryptedText))
        {
            return encryptedText;
        }

        try
        {
            var encryptedBytes = Convert.FromBase64String(encryptedText);
            var decryptedBytes = _protector.Unprotect(encryptedBytes);
            return System.Text.Encoding.UTF8.GetString(decryptedBytes);
        }
        catch (FormatException ex)
        {
            _logger.LogWarning(ex, "Failed to decrypt token - invalid base64 format. Token may not be encrypted.");
            throw new InvalidOperationException("Failed to decrypt token - invalid format. Token may not be encrypted.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt token");
            throw new InvalidOperationException("Failed to decrypt token", ex);
        }
    }

    public string? TryDecrypt(string encryptedText)
    {
        if (string.IsNullOrEmpty(encryptedText))
        {
            return encryptedText;
        }

        try
        {
            return Decrypt(encryptedText);
        }
        catch
        {
            // Return null if decryption fails (token may not be encrypted yet)
            _logger.LogDebug("Could not decrypt token - assuming it's not encrypted yet");
            return null;
        }
    }
}

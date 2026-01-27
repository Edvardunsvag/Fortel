namespace Fortedle.Server.Services;

/// <summary>
/// Service for encrypting and decrypting sensitive tokens at rest
/// </summary>
public interface ITokenEncryptionService
{
    /// <summary>
    /// Encrypts a token for storage in the database
    /// </summary>
    /// <param name="plainText">The plain text token to encrypt</param>
    /// <returns>The encrypted token as a base64 string</returns>
    string Encrypt(string plainText);

    /// <summary>
    /// Decrypts a token from the database
    /// </summary>
    /// <param name="encryptedText">The encrypted token as a base64 string</param>
    /// <returns>The decrypted plain text token</returns>
    string Decrypt(string encryptedText);

    /// <summary>
    /// Attempts to decrypt a token, returning null if decryption fails
    /// Useful for handling migration scenarios where tokens may not be encrypted
    /// </summary>
    /// <param name="encryptedText">The potentially encrypted token</param>
    /// <returns>The decrypted token, or null if decryption fails</returns>
    string? TryDecrypt(string encryptedText);
}

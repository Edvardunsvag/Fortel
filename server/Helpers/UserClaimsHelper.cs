using System.Security.Claims;

namespace Fortedle.Server.Helpers;

/// <summary>
/// Helper class for extracting user information from JWT claims.
/// Centralizes claim extraction logic to avoid duplication across controllers.
/// </summary>
public static class UserClaimsHelper
{
    /// <summary>
    /// Extract user email from JWT token claims.
    /// Tries preferred_username, email, or User.Identity.Name in order.
    /// </summary>
    /// <param name="user">The ClaimsPrincipal from the current request</param>
    /// <returns>User email or null if not found</returns>
    public static string? GetUserEmail(ClaimsPrincipal user)
    {
        // Try preferred_username first (most common in Azure AD v2.0 tokens)
        var preferredUsername = user.FindFirst("preferred_username")?.Value;
        if (!string.IsNullOrWhiteSpace(preferredUsername))
        {
            return preferredUsername;
        }

        // Try email claim
        var email = user.FindFirst(ClaimTypes.Email)?.Value 
                   ?? user.FindFirst("email")?.Value;
        if (!string.IsNullOrWhiteSpace(email))
        {
            return email;
        }

        // Fallback to User.Identity.Name
        return user.Identity?.Name;
    }

    /// <summary>
    /// Extract user ID from JWT token claims.
    /// Uses email as the user identifier for consistency with existing data model.
    /// Falls back to oid (object ID) or sub (subject) if email not available.
    /// </summary>
    /// <param name="user">The ClaimsPrincipal from the current request</param>
    /// <returns>User ID or null if not found</returns>
    public static string? GetUserId(ClaimsPrincipal user)
    {
        // Primary: Use email as user ID (consistent with existing data model)
        var email = GetUserEmail(user);
        if (!string.IsNullOrWhiteSpace(email))
        {
            return email;
        }

        // Fallback: Try oid (Azure AD Object ID)
        var oid = user.FindFirst("oid")?.Value 
                 ?? user.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value;
        if (!string.IsNullOrWhiteSpace(oid))
        {
            return oid;
        }

        // Fallback: Try sub (Subject - standard JWT claim)
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                 ?? user.FindFirst("sub")?.Value;
        if (!string.IsNullOrWhiteSpace(sub))
        {
            return sub;
        }

        return null;
    }
}

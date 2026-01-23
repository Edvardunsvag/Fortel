namespace Fortedle.Server.Extensions;

/// <summary>
/// Helper class for Azure AD configuration and URI manipulation
/// </summary>
public static class AzureAdHelper
{
    /// <summary>
    /// Extracts the base Application ID URI from an audience string.
    /// For example: "api://client-id/access_as_user" -> "api://client-id"
    /// </summary>
    /// <param name="audience">The audience string (e.g., "api://client-id/access_as_user")</param>
    /// <returns>The base Application ID URI, or the original audience if it doesn't match the expected format</returns>
    public static string GetBaseApplicationIdUri(string audience)
    {
        if (string.IsNullOrEmpty(audience))
        {
            return audience;
        }

        // Check if audience starts with "api://" and contains a slash after the prefix
        if (audience.StartsWith("api://", StringComparison.OrdinalIgnoreCase))
        {
            // Find the first slash after "api://" (position 6)
            var slashIndex = audience.IndexOf("/", 6, StringComparison.Ordinal);
            if (slashIndex != -1)
            {
                // Extract everything before the first slash (the base Application ID URI)
                return audience.Substring(0, slashIndex);
            }
        }

        // If no scope path found, return the original audience
        return audience;
    }

    /// <summary>
    /// Ensures the audience has a scope path. If it doesn't, adds the default scope.
    /// For example: "api://client-id" -> "api://client-id/access_as_user"
    /// </summary>
    /// <param name="audience">The audience string</param>
    /// <param name="defaultScope">The default scope to add if missing (default: "access_as_user")</param>
    /// <returns>The audience with a scope path</returns>
    public static string EnsureScopeInAudience(string audience, string defaultScope = "access_as_user")
    {
        if (string.IsNullOrEmpty(audience))
        {
            return audience;
        }

        // Check if audience starts with "api://" and doesn't have a scope path
        if (audience.StartsWith("api://", StringComparison.OrdinalIgnoreCase))
        {
            // Check if there's a slash after "api://" (position 6)
            var slashIndex = audience.IndexOf("/", 6, StringComparison.Ordinal);
            if (slashIndex == -1)
            {
                // No scope path found, add the default scope
                return $"{audience}/{defaultScope}";
            }
        }

        // Already has a scope path, return as-is
        return audience;
    }
}

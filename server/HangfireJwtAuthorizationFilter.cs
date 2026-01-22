using Hangfire.Dashboard;

namespace Fortedle.Server;

/// <summary>
/// Hangfire dashboard authorization filter that requires JWT authentication
/// Requires authentication in all environments (development and production).
/// Only allows access if the authentication middleware has validated the JWT token.
/// </summary>
public class HangfireJwtAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        
        // Only allow access if authentication middleware has validated the JWT token
        // The middleware sets httpContext.User.Identity.IsAuthenticated to true
        // only after successfully validating the token.
        // We do NOT check for Authorization header directly because:
        // 1. The middleware should have already processed it
        // 2. Checking header without validation would allow invalid tokens
        // 3. If middleware hasn't validated it, the token is either missing or invalid
        return httpContext.User.Identity?.IsAuthenticated ?? false;
    }
}

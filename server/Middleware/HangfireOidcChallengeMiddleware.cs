using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;

namespace Fortedle.Server.Middleware;

/// <summary>
/// For unauthenticated requests to /hangfire, challenges with OpenID Connect so the user
/// is redirected to Azure login instead of receiving 401. For /hangfire we first try the
/// Cookies scheme (OIDC sign-in cookie) so authenticated users are recognized and not sent in a loop.
/// </summary>
public class HangfireOidcChallengeMiddleware
{
    private const string HangfirePathPrefix = "/hangfire";
    private readonly RequestDelegate _next;

    public HangfireOidcChallengeMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(HangfirePathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            // Default auth only runs JWT; OIDC sign-in uses Cookies. Try Cookies so we recognize the user.
            var cookieResult = await context.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (cookieResult.Succeeded && cookieResult.Principal?.Identity?.IsAuthenticated == true)
            {
                context.User = cookieResult.Principal;
            }

            if (!(context.User.Identity?.IsAuthenticated ?? false))
            {
                await context.ChallengeAsync(OpenIdConnectDefaults.AuthenticationScheme);
                return;
            }
        }

        await _next(context);
    }
}

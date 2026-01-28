using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace Fortedle.Server.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAzureAdAuthentication(this IServiceCollection services, IConfiguration configuration, ILogger logger)
    {
        var azureAdSection = configuration.GetSection("AzureAd");
        var instance = azureAdSection["Instance"] ?? "https://login.microsoftonline.com/";
        var clientId = azureAdSection["ClientId"];
        var tenantId = azureAdSection["TenantId"];
        var audience = azureAdSection["Audience"];

        if (!string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(audience))
        {
            // Default scheme remains JWT so API and [Authorize] controllers use Bearer tokens
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.Authority = $"{instance}{tenantId}/v2.0";
                    options.Audience = audience;
                    
                    // Extract base Application ID URI from audience if it contains a scope
                    // e.g., "api://client-id/access_as_user" -> "api://client-id"
                    var baseApplicationIdUri = AzureAdHelper.GetBaseApplicationIdUri(audience);
                    
                    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        // Accept multiple audience formats:
                        // 1. Full scope URI: api://client-id/access_as_user (from audience config)
                        // 2. Base Application ID URI: api://client-id (what Azure AD returns for scoped tokens)
                        // 3. Client ID: client-id (for client-id/.default scopes)
                        ValidAudiences = new[] { audience, baseApplicationIdUri, clientId },
                        // Accept both v1.0 and v2.0 issuer formats
                        // v1.0: https://sts.windows.net/{tenantId}/
                        // v2.0: https://login.microsoftonline.com/{tenantId}/v2.0
                        ValidIssuers = new[]
                        {
                            $"https://sts.windows.net/{tenantId}/",
                            $"{instance}{tenantId}/v2.0"
                        }
                    };
                    
                    // Allow JWT token to be read from cookies or query parameters for Hangfire dashboard
                    // This enables browser-based access to the dashboard
                    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            // First, try to get token from Authorization header (standard way)
                            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                            
                            // If not found, try to get from cookie
                            if (string.IsNullOrEmpty(token))
                            {
                                token = context.Request.Cookies["accessToken"];
                            }
                            
                            // If still not found, try query parameter (for Hangfire dashboard)
                            if (string.IsNullOrEmpty(token) && context.Request.Query.ContainsKey("access_token"))
                            {
                                token = context.Request.Query["access_token"];
                            }
                            
                            if (!string.IsNullOrEmpty(token))
                            {
                                context.Token = token;
                            }
                            
                            return Task.CompletedTask;
                        }
                    };
                })
                .AddMicrosoftIdentityWebApp(
                    azureAdSection,
                    OpenIdConnectDefaults.AuthenticationScheme,
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    subscribeToOpenIdConnectMiddlewareDiagnosticsEvents: false,
                    displayName: "Azure AD");

            // OIDC cookies and response: must be sent when callback hits /signin-oidc even though challenge was from /hangfire.
            // Path=/, SameSite=Lax, response_mode=query so callback is GET with query string (state in URL, not fragment).
            // Explicit ResponseType=Code so state/code are in query string; hybrid/implicit can put them in fragment (not sent to server).
            services.Configure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
            {
                options.ResponseType = OpenIdConnectResponseType.Code;
                options.ResponseMode = OpenIdConnectResponseMode.Query;
                options.CorrelationCookie.Path = "/";
                options.CorrelationCookie.SameSite = SameSiteMode.Lax;
                options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.NonceCookie.Path = "/";
                options.NonceCookie.SameSite = SameSiteMode.Lax;
                options.NonceCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            });

            services.AddAuthorization(options =>
            {
                // HangfirePolicy: OIDC first so unauthenticated requests get redirect to Azure (not 401)
                options.AddPolicy("HangfirePolicy", policy =>
                {
                    policy.AddAuthenticationSchemes(
                        OpenIdConnectDefaults.AuthenticationScheme,
                        JwtBearerDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                });
            });
            logger.LogInformation("Azure AD authentication configured: ClientId={ClientId}, TenantId={TenantId}, Audience={Audience}", 
                clientId, tenantId, audience);
        }
        else
        {
            logger.LogWarning("Azure AD configuration is missing. Authentication will not be enabled.");
        }

        return services;
    }
}

using Fortedle.Server;
using Fortedle.Server.Middleware;
using Hangfire;
using Hangfire.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using AspNetCoreRateLimit;

namespace Fortedle.Server.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication ConfigureMiddlewarePipeline(this WebApplication app, IConfiguration configuration, List<string> allowedOrigins)
    {
        // HTTPS Redirection - must be early in pipeline (production only)
        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        // Security Headers - add early in pipeline
        app.UseMiddleware<SecurityHeadersMiddleware>();

        // Configure the HTTP request pipeline
        // Log all requests (early in pipeline)
        app.Use(async (context, next) =>
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("{Method} {Path} - Origin: {Origin}",
                context.Request.Method,
                context.Request.Path,
                context.Request.Headers.Origin.ToString());
            await next();
        });

        // CORS must be before routing
        app.UseCors();

        // Rate Limiting - must be after CORS but before routing
        app.UseIpRateLimiting();

        // Explicit routing
        app.UseRouting();

        // Authentication and Authorization must be after routing but before endpoints
        app.UseAuthentication();
        app.UseAuthorization();

        // Hangfire Dashboard - requires Azure AD authentication if configured
        var azureAdSection = configuration.GetSection("AzureAd");
        var clientId = azureAdSection["ClientId"];
        var tenantId = azureAdSection["TenantId"];
        var audience = azureAdSection["Audience"];

        var dashboardOptions = new DashboardOptions();
        if (!string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(audience))
        {
            // Use custom authorization filter that checks if user is authenticated
            // This works with JWT tokens from cookies, query parameters, or Authorization header
            dashboardOptions.Authorization = new[]
            {
                new HangfireJwtAuthorizationFilter()
            };
        }
        else
        {
            // No authentication required if Azure AD is not configured
            dashboardOptions.Authorization = Array.Empty<IDashboardAuthorizationFilter>();
        }
        app.MapHangfireDashboard("/hangfire", dashboardOptions);

        // Enable Swagger in both Development and Production
        app.UseSwagger(c =>
        {
            c.RouteTemplate = "swagger/{documentName}/swagger.json";
            // Configure Swagger to use the correct scheme (http/https) based on the request
            c.PreSerializeFilters.Add((swaggerDoc, httpReq) =>
            {
                swaggerDoc.Servers = new List<OpenApiServer>
                {
                    new OpenApiServer
                    {
                        Url = $"{httpReq.Scheme}://{httpReq.Host.Value}",
                        Description = httpReq.Host.Value.Contains("azurewebsites.net") ? "Production" : "Development"
                    }
                };
            });
        });

        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Fortedle API v1");
            c.RoutePrefix = "swagger";
            c.DisplayRequestDuration();
            // Enable deep linking
            c.EnableDeepLinking();
            // Enable filter
            c.EnableFilter();
            
            // Configure OAuth2 for Azure AD authentication
            if (!string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(audience))
            {
                c.OAuthClientId(clientId);
                c.OAuthAppName("Fortedle API");
                c.OAuthUsePkce();
                c.OAuthScopeSeparator(" ");
                
                // For SPA apps, Swagger UI needs to handle token redemption client-side
                // Ensure the redirect URI is registered as "Single-page application" type in Azure AD
                // The redirect URI should be: {backend-url}/swagger/oauth2-redirect.html
            }
        });

        // Map endpoints
        app.MapHealthChecks("/health");
        app.MapControllers();

        return app;
    }
}

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

namespace Fortedle.Server.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services, IConfiguration configuration)
    {
        var azureAdSection = configuration.GetSection("AzureAd");
        var clientId = azureAdSection["ClientId"];
        var tenantId = azureAdSection["TenantId"];
        var audience = azureAdSection["Audience"];

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Fortedle API",
                Version = "v1",
                Description = "API for Fortedle game"
            });
            
            // Add OAuth2 authentication to Swagger with Azure AD redirect flow
            if (!string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(audience))
            {
                var instance = azureAdSection["Instance"] ?? "https://login.microsoftonline.com/";
                var authorizationUrl = $"{instance}{tenantId}/oauth2/v2.0/authorize";
                var tokenUrl = $"{instance}{tenantId}/oauth2/v2.0/token";
                
                // For Azure AD, use the Application ID URI as the scope
                // Ensure the audience has a scope path (e.g., "api://client-id/access_as_user")
                var scopeName = AzureAdHelper.EnsureScopeInAudience(audience);
                
                c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.OAuth2,
                    Flows = new OpenApiOAuthFlows
                    {
                        AuthorizationCode = new OpenApiOAuthFlow
                        {
                            AuthorizationUrl = new Uri(authorizationUrl),
                            TokenUrl = new Uri(tokenUrl),
                            Scopes = new Dictionary<string, string>
                            {
                                { scopeName, "Access the Fortedle API" }
                            }
                        }
                    },
                    Description = "Azure AD OAuth2 Authorization Code flow. Click 'Authorize' to be redirected to Azure AD login."
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "oauth2"
                            }
                        },
                        new[] { scopeName }
                    }
                });
            }
            
            // Include XML comments if available (optional)
            var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                c.IncludeXmlComments(xmlPath);
            }
            
            // Ensure all controllers are included
            c.CustomSchemaIds(type => type.FullName);
        });

        return services;
    }
}

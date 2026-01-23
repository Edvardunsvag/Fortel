using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Fortedle.Server.Extensions;

public static class CorsExtensions
{
    public static List<string> AddCorsPolicy(this IServiceCollection services, IHostEnvironment environment, IConfiguration configuration)
    {
        // Configure CORS
        List<string> allowedOrigins;

        if (environment.IsDevelopment())
        {
            // Development: Allow localhost origins
            allowedOrigins = new List<string> 
            { 
                "http://localhost:5173", 
                "http://localhost:8080"
            };
        }
        else
        {
            // Production: Only allow the frontend origin
            allowedOrigins = new List<string> 
            { 
                "https://fortedle.hackathon.forteapps.net"
            };
            
            // Optionally allow additional origins from configuration
            var additionalOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            if (additionalOrigins != null && additionalOrigins.Length > 0)
            {
                allowedOrigins.AddRange(additionalOrigins);
            }
        }

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins(allowedOrigins.ToArray())
                    // Only allow the HTTP methods your API actually uses
                    .WithMethods("GET", "POST", "OPTIONS")
                    // Only allow the headers your API actually needs
                    .WithHeaders("Authorization", "Content-Type", "X-Requested-With")
                    .AllowCredentials()
                    .WithExposedHeaders("Content-Type")
                    .SetPreflightMaxAge(TimeSpan.FromHours(24));
            });
        });

        return allowedOrigins;
    }
}

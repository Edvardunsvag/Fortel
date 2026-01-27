using Fortedle.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Fortedle.Server.Extensions;

public static class DatabaseExtensions
{
    public static string GetConnectionString(this IConfiguration configuration, ILogger logger)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // Log which connection string is being used
        if (!string.IsNullOrEmpty(connectionString))
        {
            var safeConnectionString = connectionString.Contains("Password=")
                ? connectionString.Substring(0, connectionString.IndexOf("Password=")) + "Password=***"
                : connectionString;
            logger.LogInformation("Using connection string from configuration: {ConnectionString}", safeConnectionString);
        }
        else
        {
            logger.LogWarning("No connection string found in configuration, will build from individual settings");
        }

        if (string.IsNullOrEmpty(connectionString))
        {
            // Build connection string from individual settings
            // Try environment variables first (DB_HOST, DB_PORT, etc.), then fall back to Database: keys
            var dbHost = configuration["DB_HOST"] 
                         ?? configuration["Database:Host"] 
                         ?? "localhost";
            var dbPort = configuration["DB_PORT"] 
                         ?? configuration["Database:Port"] 
                         ?? "5432";
            var dbName = configuration["DB_NAME"] 
                         ?? configuration["Database:Database"] 
                         ?? "fortedle";
            var dbUser = configuration["DB_USER"] 
                         ?? configuration["Database:User"] 
                         ?? "postgres";
            var dbPassword = configuration["DB_PASSWORD"] 
                             ?? configuration["Database:Password"] 
                             ?? "postgres";

            // Determine SSL mode (Azure PostgreSQL requires SSL)
            var isAzurePostgres = !dbHost.Contains("localhost", StringComparison.OrdinalIgnoreCase) &&
                                 !dbHost.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase);
            var sslMode = isAzurePostgres ? "Require" : "Prefer";
            var trustServerCertificate = isAzurePostgres ? "Trust Server Certificate=true" : "";

            connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword};SSL Mode={sslMode}";
            if (!string.IsNullOrEmpty(trustServerCertificate))
            {
                connectionString += $";{trustServerCertificate}";
            }
            
            logger.LogInformation("Built connection string from environment variables: Host={Host}, Database={Database}, User={User}", 
                dbHost, dbName, dbUser);
        }

        return connectionString;
    }

    public static IServiceCollection AddDatabase(this IServiceCollection services, string connectionString)
    {
        // Configure Entity Framework
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
            });
        });

        // Add health checks
        services.AddHealthChecks()
            .AddNpgSql(connectionString);

        return services;
    }
}

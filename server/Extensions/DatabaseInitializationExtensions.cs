using Fortedle.Server.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Data;

namespace Fortedle.Server.Extensions;

public static class DatabaseInitializationExtensions
{
    public static void InitializeDatabase(this IApplicationBuilder app, string connectionString)
    {
        // Initialize database (non-blocking)
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = app.ApplicationServices.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                logger.LogInformation("Initializing database...");
                
                // Log connection string (without password for security)
                var connectionStringForLogging = connectionString;
                if (!string.IsNullOrEmpty(connectionStringForLogging))
                {
                    var safeConnectionString = connectionStringForLogging.Contains("Password=")
                        ? connectionStringForLogging.Substring(0, connectionStringForLogging.IndexOf("Password=")) + "Password=***"
                        : connectionStringForLogging;
                    logger.LogInformation("Connection string: {ConnectionString}", safeConnectionString);
                }
                else
                {
                    logger.LogWarning("No connection string found in configuration");
                }

                // Ensure database can connect
                try
                {
                    // Try to actually connect and execute a query to get detailed error
                    logger.LogInformation("Attempting to connect to database...");
                    var canConnect = await context.Database.CanConnectAsync();
                    
                    if (canConnect)
                    {
                        logger.LogInformation("Database connection successful");
                        
                        // Try to execute a simple query to verify connection works
                        try
                        {
                            await context.Database.ExecuteSqlRawAsync("SELECT 1");
                            logger.LogInformation("Database query test successful");
                        }
                        catch (Exception queryEx)
                        {
                            logger.LogError(queryEx, "Database query test failed: {Message}", queryEx.Message);
                        }

                        // Apply pending migrations (if any)
                        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                        if (pendingMigrations.Any())
                        {
                            logger.LogInformation("Applying {Count} pending migration(s)...", pendingMigrations.Count());
                            try
                            {
                                await context.Database.MigrateAsync();
                                logger.LogInformation("Database migrations applied successfully");
                            }
                            catch (PostgresException ex) when (ex.SqlState == "42P07") // relation already exists
                            {
                                logger.LogWarning("Migration failed because table already exists (SqlState: {SqlState}). Attempting to reconcile migration history...", ex.SqlState);
                                
                                try
                                {
                                    // Ensure connection is open
                                    if (context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
                                    {
                                        await context.Database.OpenConnectionAsync();
                                    }
                                    
                                    var connection = context.Database.GetDbConnection();
                                    
                                    // Check if migration history table exists
                                    bool historyTableExists = false;
                                    using (var command = connection.CreateCommand())
                                    {
                                        command.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__EFMigrationsHistory')";
                                        var result = await command.ExecuteScalarAsync();
                                        historyTableExists = result != null && (bool)result;
                                        logger.LogInformation("Migration history table exists: {Exists}", historyTableExists);
                                    }
                                    
                                    if (!historyTableExists)
                                    {
                                        // Migration history table doesn't exist, create it first
                                        logger.LogInformation("Creating __EFMigrationsHistory table...");
                                        await context.Database.ExecuteSqlRawAsync(@"
                                            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                                                ""MigrationId"" VARCHAR(150) NOT NULL PRIMARY KEY,
                                                ""ProductVersion"" VARCHAR(32) NOT NULL
                                            );
                                        ");
                                        logger.LogInformation("Migration history table created");
                                    }
                                    
                                    // Check if employees table exists (for InitialSchema migration)
                                    bool employeesExists = false;
                                    using (var command = connection.CreateCommand())
                                    {
                                        command.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')";
                                        var result = await command.ExecuteScalarAsync();
                                        employeesExists = result != null && (bool)result;
                                        logger.LogInformation("Employees table exists: {Exists}", employeesExists);
                                    }
                                    
                                    // Get pending and applied migrations
                                    var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
                                    logger.LogInformation("Applied migrations: {AppliedMigrations}", string.Join(", ", appliedMigrations));
                                    logger.LogInformation("Pending migrations: {PendingMigrations}", string.Join(", ", pendingMigrations));
                                    
                                    // If employees table exists but InitialSchema migration isn't applied, mark it as applied
                                    foreach (var migration in pendingMigrations)
                                    {
                                        if (migration.Contains("InitialSchema") && !appliedMigrations.Contains(migration))
                                        {
                                            if (employeesExists)
                                            {
                                                logger.LogInformation("Tables for migration {Migration} already exist. Marking migration as applied...", migration);
                                                
                                                // Insert migration into history using parameterized query
                                                // Migration name comes from EF Core, so it's safe, but we use ExecuteSqlInterpolated for safety
                                                await context.Database.ExecuteSqlInterpolatedAsync(
                                                    $@"INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") 
                                                      VALUES ({migration}, '8.0.0') 
                                                      ON CONFLICT (""MigrationId"") DO NOTHING");
                                                
                                                logger.LogInformation("Migration {Migration} marked as applied", migration);
                                            }
                                            else
                                            {
                                                logger.LogWarning("Migration {Migration} is pending but employees table does not exist. Skipping reconciliation.", migration);
                                            }
                                        }
                                    }
                                    
                                    // Try to apply migrations again after reconciling history
                                    var remainingPendingMigrations = await context.Database.GetPendingMigrationsAsync();
                                    if (remainingPendingMigrations.Any())
                                    {
                                        logger.LogInformation("Retrying migration after reconciling history. {Count} migration(s) remaining: {Migrations}", 
                                            remainingPendingMigrations.Count(), string.Join(", ", remainingPendingMigrations));
                                        try
                                        {
                                            await context.Database.MigrateAsync();
                                            logger.LogInformation("Database migrations applied successfully after reconciliation");
                                        }
                                        catch (Exception retryEx)
                                        {
                                            logger.LogError(retryEx, "Migration retry failed: {Message}", retryEx.Message);
                                            logger.LogWarning("Please manually verify and fix migration state if needed");
                                        }
                                    }
                                    else
                                    {
                                        logger.LogInformation("All migrations are now up to date after reconciliation");
                                    }
                                }
                                catch (Exception reconcileEx)
                                {
                                    logger.LogError(reconcileEx, "Error during migration reconciliation: {Message}", reconcileEx.Message);
                                    logger.LogWarning("Migration reconciliation failed. Please manually verify migration state.");
                                }
                            }
                            catch (Exception migrationEx)
                            {
                                // Catch-all for all other migration errors (table doesn't exist, syntax errors, constraint violations, etc.)
                                logger.LogError(migrationEx, 
                                    "Migration failed with error: {Message}. Exception type: {ExceptionType}. " +
                                    "Pending migrations: {PendingMigrations}. " +
                                    "This is a critical error that needs to be resolved before the application can function correctly.",
                                    migrationEx.Message, 
                                    migrationEx.GetType().Name,
                                    string.Join(", ", pendingMigrations));
                                
                                // Log inner exception details if available
                                if (migrationEx.InnerException != null)
                                {
                                    logger.LogError("Inner exception: {InnerException}", migrationEx.InnerException.Message);
                                }
                                
                                // For PostgresException, log SQL state and detail for better debugging
                                if (migrationEx is PostgresException pgEx)
                                {
                                    logger.LogError("PostgreSQL error code: {SqlState}, Detail: {Detail}, Message: {MessageText}", 
                                        pgEx.SqlState, pgEx.Detail ?? "N/A", pgEx.MessageText);
                                }
                                
                                logger.LogError("CRITICAL: Database migrations failed. The application will continue running, but database operations may fail. " +
                                    "Please resolve migration errors by: " +
                                    "1. Checking migration files for errors, " +
                                    "2. Verifying database permissions, " +
                                    "3. Manually applying migrations using: dotnet ef database update --project Fortedle.Server.csproj");
                            }
                        }
                        else
                        {
                            logger.LogInformation("Database is up to date");
                        }
                    }
                    else
                    {
                        // CanConnectAsync returned false, try to get more details by attempting a query
                        logger.LogWarning("CanConnectAsync returned false. Attempting query to get error details...");
                        try
                        {
                            await context.Database.ExecuteSqlRawAsync("SELECT 1");
                        }
                        catch (Exception queryEx)
                        {
                            logger.LogError(queryEx, "Database connection failed: {Message}", queryEx.Message);
                            logger.LogError("Exception type: {ExceptionType}", queryEx.GetType().Name);
                            if (queryEx.InnerException != null)
                            {
                                logger.LogError("Inner exception: {InnerException}", queryEx.InnerException.Message);
                                if (queryEx.InnerException.InnerException != null)
                                {
                                    logger.LogError("Inner inner exception: {InnerInnerException}", queryEx.InnerException.InnerException.Message);
                                }
                            }
                        }
                        logger.LogWarning("Cannot connect to database. Server will continue running, but database operations may fail.");
                    }
                }
                catch (Exception dbEx)
                {
                    logger.LogError(dbEx, "Database connection failed: {Message}", dbEx.Message);
                    logger.LogError("Exception type: {ExceptionType}", dbEx.GetType().Name);
                    if (dbEx.InnerException != null)
                    {
                        logger.LogError("Inner exception: {InnerException}", dbEx.InnerException.Message);
                        if (dbEx.InnerException.InnerException != null)
                        {
                            logger.LogError("Inner inner exception: {InnerInnerException}", dbEx.InnerException.InnerException.Message);
                        }
                    }
                    logger.LogWarning("Server will continue running, but database operations may fail");
                }
            }
            catch (Exception ex)
            {
                var logger = app.ApplicationServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Failed to initialize database: {Message}", ex.Message);
                logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
                logger.LogWarning("Server will continue running, but database operations may fail");
            }
        });
    }
}

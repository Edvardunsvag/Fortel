using Fortedle.Server.Data;
using Fortedle.Server.Repositories;
using Fortedle.Server.Services;
using Hangfire;
using Hangfire.Dashboard;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Npgsql;
using System.Data;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Log environment and configuration sources early
var earlyLogger = LoggerFactory.Create(config => config.AddConsole()).CreateLogger<Program>();
earlyLogger.LogInformation("Environment: {Environment}", builder.Environment.EnvironmentName);
earlyLogger.LogInformation("IsDevelopment: {IsDevelopment}", builder.Environment.IsDevelopment());
earlyLogger.LogInformation("IsProduction: {IsProduction}", builder.Environment.IsProduction());

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = builder.Environment.IsDevelopment();
    });

// Configure CORS
var defaultOrigins = new[] { "http://localhost:5173", "http://localhost:8080" };
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? defaultOrigins;

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .WithExposedHeaders("Content-Type")
            .SetPreflightMaxAge(TimeSpan.FromHours(24));
    });
});

// Configure database connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Log which connection string is being used
if (!string.IsNullOrEmpty(connectionString))
{
    var safeConnectionString = connectionString.Contains("Password=")
        ? connectionString.Substring(0, connectionString.IndexOf("Password=")) + "Password=***"
        : connectionString;
    earlyLogger.LogInformation("Using connection string from configuration: {ConnectionString}", safeConnectionString);
}
else
{
    earlyLogger.LogWarning("No connection string found in configuration, will build from individual settings");
}

if (string.IsNullOrEmpty(connectionString))
{
    // Build connection string from individual settings
    // Try environment variables first (DB_HOST, DB_PORT, etc.), then fall back to Database: keys
    var dbHost = builder.Configuration["DB_HOST"] 
                 ?? builder.Configuration["Database:Host"] 
                 ?? "localhost";
    var dbPort = builder.Configuration["DB_PORT"] 
                 ?? builder.Configuration["Database:Port"] 
                 ?? "5432";
    var dbName = builder.Configuration["DB_NAME"] 
                 ?? builder.Configuration["Database:Database"] 
                 ?? "fortedle";
    var dbUser = builder.Configuration["DB_USER"] 
                 ?? builder.Configuration["Database:User"] 
                 ?? "postgres";
    var dbPassword = builder.Configuration["DB_PASSWORD"] 
                     ?? builder.Configuration["Database:Password"] 
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
    
    earlyLogger.LogInformation("Built connection string from environment variables: Host={Host}, Database={Database}, User={User}", 
        dbHost, dbName, dbUser);
}

// Configure Entity Framework
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null);
    });
});

// Register repositories first
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IRoundRepository, RoundRepository>();
builder.Services.AddScoped<ILeaderboardRepository, LeaderboardRepository>();
builder.Services.AddScoped<ILotteryTicketRepository, LotteryTicketRepository>();
builder.Services.AddScoped<IWinningTicketRepository, WinningTicketRepository>();
builder.Services.AddScoped<IMonthlyWinningTicketRepository, MonthlyWinningTicketRepository>();
builder.Services.AddScoped<ILotteryConfigRepository, LotteryConfigRepository>();

// Register services (which depend on repositories)
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();
builder.Services.AddScoped<ISyncService, SyncService>();
builder.Services.AddScoped<IRoundService, RoundService>();
builder.Services.AddScoped<ILotteryTicketService, LotteryTicketService>();
builder.Services.AddScoped<ILotteryDrawingService, LotteryDrawingService>();
builder.Services.AddScoped<IMonthlyLotteryDrawingService, MonthlyLotteryDrawingService>();
builder.Services.AddScoped<IWheelDataService, WheelDataService>();

// Add HttpClient for external API calls
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<HarvestApiService>();

// Add health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

// Configure Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString)));

builder.Services.AddHangfireServer();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Fortedle API",
        Version = "v1",
        Description = "API for Fortedle game"
    });
    
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

var app = builder.Build();

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

// Explicit routing
app.UseRouting();

// Hangfire Dashboard - enabled in both Development and Production (matching Swagger behavior)
var dashboardOptions = new DashboardOptions();
// Allow all requests - use empty array to disable authorization
// Note: In production, you may want to add proper authorization for security
dashboardOptions.Authorization = Array.Empty<IDashboardAuthorizationFilter>();
app.UseHangfireDashboard("/hangfire", dashboardOptions);

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
});

// Map endpoints
app.MapHealthChecks("/health");
app.MapControllers();

// Initialize database (non-blocking)
_ = Task.Run(async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
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
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Failed to initialize database: {Message}", ex.Message);
        logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
        logger.LogWarning("Server will continue running, but database operations may fail");
    }
});

// Log startup information
var logger = app.Services.GetRequiredService<ILogger<Program>>();
var port = builder.Configuration["Kestrel:Endpoints:Http:Url"]?.Split(':').LastOrDefault() 
    ?? builder.Configuration["PORT"] 
    ?? "3001";
logger.LogInformation("Server starting on port {Port}", port);
logger.LogInformation("Allowed CORS origins: {Origins}", string.Join(", ", allowedOrigins));

// Set up Hangfire recurring job for lottery drawing (every Friday at 15:00)
RecurringJob.AddOrUpdate<ILotteryDrawingService>(
    "lottery-drawing-friday-15-00",
    service => service.DrawWeekWinner(),
    "0 15 * * 5", // Cron expression: Every Friday at 15:00 (UTC)
    new RecurringJobOptions
    {
        TimeZone = TimeZoneInfo.Utc
    });

logger.LogInformation("Hangfire recurring job 'lottery-drawing-friday-15-00' scheduled for every Friday at 15:00 UTC");

app.Run();


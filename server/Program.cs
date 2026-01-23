using Fortedle.Server.Extensions;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Hangfire;
using Fortedle.Server.Services;

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
var allowedOrigins = builder.Services.AddCorsPolicy(builder.Environment, builder.Configuration);

// Configure database connection
var connectionString = builder.Configuration.GetConnectionString(earlyLogger);

// Configure database and health checks
builder.Services.AddDatabase(connectionString);

// Register application services (repositories, services, HttpClient)
builder.Services.AddApplicationServices();

// Configure Azure AD Authentication
builder.Services.AddAzureAdAuthentication(builder.Configuration, earlyLogger);

// Configure Hangfire
builder.Services.AddHangfireServices(connectionString);

// Configure Swagger
builder.Services.AddSwaggerDocumentation(builder.Configuration);

var app = builder.Build();

// Configure middleware pipeline
app.ConfigureMiddlewarePipeline(builder.Configuration, allowedOrigins);

// Initialize database (non-blocking)
app.InitializeDatabase(connectionString);

// Log startup information
var logger = app.Services.GetRequiredService<ILogger<Program>>();
var port = builder.Configuration["Kestrel:Endpoints:Http:Url"]?.Split(':').LastOrDefault() 
    ?? builder.Configuration["PORT"] 
    ?? "3001";
logger.LogInformation("Server starting on port {Port}", port);
logger.LogInformation("Allowed CORS origins: {Origins}", string.Join(", ", allowedOrigins));

// Set up Hangfire recurring job for lottery drawing (every Friday at 15:00 Norway time)
var norwayTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Oslo");
RecurringJob.AddOrUpdate<ILotteryDrawingService>(
    "lottery-drawing-friday-15-00",
    service => service.DrawWeekWinner(),
    "0 15 * * 5", // Cron expression: Every Friday at 15:00 (Norway time)
    new RecurringJobOptions
    {
        TimeZone = norwayTimeZone
    });

logger.LogInformation("Hangfire recurring job 'lottery-drawing-friday-15-00' scheduled for every Friday at 15:00 Norway time (Europe/Oslo)");

app.Run();

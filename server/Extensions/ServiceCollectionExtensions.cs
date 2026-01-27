using Fortedle.Server.Repositories;
using Fortedle.Server.Services;
using Fortedle.Server.Services.Harvest;
using Microsoft.Extensions.DependencyInjection;

namespace Fortedle.Server.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register repositories first
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();
        services.AddScoped<IRoundRepository, RoundRepository>();
        services.AddScoped<ILeaderboardRepository, LeaderboardRepository>();
        services.AddScoped<ILotteryTicketRepository, LotteryTicketRepository>();
        services.AddScoped<IWinningTicketRepository, WinningTicketRepository>();
        services.AddScoped<IMonthlyWinningTicketRepository, MonthlyWinningTicketRepository>();
        services.AddScoped<ILotteryConfigRepository, LotteryConfigRepository>();
        services.AddScoped<IEmployeeWeekRepository, EmployeeWeekRepository>();
        services.AddScoped<IGiftcardTransactionRepository, GiftcardTransactionRepository>();
        services.AddScoped<IHarvestTokenRepository, HarvestTokenRepository>();

        // Register services (which depend on repositories)
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<ISyncService, SyncService>();
        services.AddScoped<IRoundService, RoundService>();
        services.AddScoped<ILotteryTicketService, LotteryTicketService>();
        services.AddScoped<ILotteryDrawingService, LotteryDrawingService>();
        services.AddScoped<IMonthlyLotteryDrawingService, MonthlyLotteryDrawingService>();
        services.AddScoped<IWheelDataService, WheelDataService>();
        services.AddScoped<IWinnersService, WinnersService>();
        services.AddScoped<ILotteryStatisticsService, LotteryStatisticsService>();
        services.AddScoped<IEmployeeWeekService, EmployeeWeekService>();
        services.AddScoped<IGledeApiService, GledeApiService>();
        services.AddScoped<IGiftcardService, GiftcardService>();
        services.AddScoped<ITokenEncryptionService, TokenEncryptionService>();

        // Register Harvest services (order matters - dependencies first)
        services.AddScoped<HarvestConfiguration>();
        services.AddHttpClient<IHarvestOAuthService, HarvestOAuthService>();
        services.AddHttpClient<IHarvestTokenManager, HarvestTokenManager>();
        services.AddHttpClient<IHarvestApiClient, HarvestApiClient>();
        // HarvestApiService is a facade that uses other services (not HttpClient directly)
        services.AddScoped<HarvestApiService>();

        // Add HttpClient for external API calls
        services.AddHttpClient();

        return services;
    }
}

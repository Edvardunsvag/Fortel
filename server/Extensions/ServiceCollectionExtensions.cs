using Fortedle.Server.Repositories;
using Fortedle.Server.Services;
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

        // Register services (which depend on repositories)
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<ISyncService, SyncService>();
        services.AddScoped<IRoundService, RoundService>();
        services.AddScoped<ILotteryTicketService, LotteryTicketService>();
        services.AddScoped<ILotteryDrawingService, LotteryDrawingService>();
        services.AddScoped<IMonthlyLotteryDrawingService, MonthlyLotteryDrawingService>();
        services.AddScoped<IWheelDataService, WheelDataService>();
        services.AddScoped<IEmployeeWeekService, EmployeeWeekService>();
        services.AddScoped<IGledeApiService, GledeApiService>();
        services.AddScoped<IGiftcardService, GiftcardService>();

        // Add HttpClient for external API calls
        services.AddHttpClient();
        services.AddHttpClient<HarvestApiService>();

        return services;
    }
}

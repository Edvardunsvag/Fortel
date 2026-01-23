using System.Globalization;
using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;

namespace Fortedle.Server.Services;

public interface IEmployeeWeekService
{
    Task<SyncHarvestResponse> SyncFromHarvestAsync(SyncHarvestRequest request);
    Task<EmployeeWeeksResponse> GetEmployeeWeeksAsync(string userId);
}

public class EmployeeWeekService : IEmployeeWeekService
{
    private readonly IEmployeeWeekRepository _employeeWeekRepository;
    private readonly ILotteryTicketRepository _lotteryTicketRepository;
    private readonly IWinningTicketRepository _winningTicketRepository;
    private readonly IGiftcardTransactionRepository _giftcardTransactionRepository;
    private readonly ILotteryTicketService _lotteryTicketService;
    private readonly HarvestApiService _harvestApiService;
    private readonly ILogger<EmployeeWeekService> _logger;

    public EmployeeWeekService(
        IEmployeeWeekRepository employeeWeekRepository,
        ILotteryTicketRepository lotteryTicketRepository,
        IWinningTicketRepository winningTicketRepository,
        IGiftcardTransactionRepository giftcardTransactionRepository,
        ILotteryTicketService lotteryTicketService,
        HarvestApiService harvestApiService,
        ILogger<EmployeeWeekService> logger)
    {
        _employeeWeekRepository = employeeWeekRepository;
        _lotteryTicketRepository = lotteryTicketRepository;
        _winningTicketRepository = winningTicketRepository;
        _giftcardTransactionRepository = giftcardTransactionRepository;
        _lotteryTicketService = lotteryTicketService;
        _harvestApiService = harvestApiService;
        _logger = logger;
    }

    public async Task<SyncHarvestResponse> SyncFromHarvestAsync(SyncHarvestRequest request)
    {
        try
        {
            _logger.LogInformation("Starting Harvest sync for user with account {AccountId}", request.AccountId);

            // Get valid token
            var (accessToken, accountId) = await _harvestApiService.GetValidTokenAsync(
                request.AccessToken,
                request.RefreshToken,
                request.ExpiresAt,
                request.AccountId);

            // Fetch user info - first get /users/me to get the user ID
            var user = await _harvestApiService.GetCurrentUserAsync(
                accessToken,
                request.RefreshToken,
                request.ExpiresAt,
                accountId);
            
            if (user == null)
            {
                throw new InvalidOperationException("Failed to fetch current user from Harvest API");
            }
            var userId = user.Id.ToString();
            var userName = $"{user.FirstName} {user.LastName}".Trim();

            _logger.LogInformation("Fetched user info: ID={UserId}, Name={UserName}", userId, userName);

            // Calculate date range (only 2026)
            var fromDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var toDate = new DateTime(2026, 12, 31, 23, 59, 59, DateTimeKind.Utc);
            var fromDateStr = fromDate.ToString("yyyy-MM-dd");
            var toDateStr = toDate.ToString("yyyy-MM-dd");

            _logger.LogInformation("Fetching time entries from {FromDate} to {ToDate}", fromDateStr, toDateStr);

            // Fetch time entries
            var timeEntries = await _harvestApiService.GetTimeEntriesAsync(
                user.Id,
                fromDateStr,
                toDateStr,
                accessToken,
                request.RefreshToken,
                request.ExpiresAt,
                accountId);

            _logger.LogInformation("Fetched {Count} time entries", timeEntries.Count);

            // Group entries by week and calculate summaries
            var weeksData = GroupEntriesByWeek(timeEntries);

            // Filter to only keep 2026 weeks
            weeksData = weeksData.Where(w => w.WeekKey.StartsWith("2026-")).ToList();

            _logger.LogInformation("Grouped into {Count} weeks (2026 only)", weeksData.Count);

            // Upsert weeks in database
            var weeksSynced = 0;
            var weeksUpdated = 0;
            var eligibleWeeks = new List<string>();

            foreach (var weekData in weeksData)
            {
                var existing = await _employeeWeekRepository.GetByUserIdAndWeekAsync(userId, weekData.WeekKey);
                
                var employeeWeek = new EmployeeWeek
                {
                    UserId = userId,
                    WeekKey = weekData.WeekKey,
                    WeekStart = weekData.WeekStart,
                    WeekEnd = weekData.WeekEnd,
                    Hours = weekData.Hours,
                    BillableHours = weekData.BillableHours,
                    IsLotteryEligible = weekData.IsLotteryEligible,
                    UpdatedAt = DateTime.UtcNow,
                };

                if (existing != null)
                {
                    weeksUpdated++;
                }
                else
                {
                    weeksSynced++;
                    employeeWeek.CreatedAt = DateTime.UtcNow;
                }

                await _employeeWeekRepository.UpsertAsync(employeeWeek);

                if (weekData.IsLotteryEligible)
                {
                    eligibleWeeks.Add(weekData.WeekKey);
                }
            }

            _logger.LogInformation("Synced {Synced} new weeks, updated {Updated} existing weeks", weeksSynced, weeksUpdated);

            // Sync lottery tickets
            var syncTicketsRequest = new SyncLotteryTicketsRequest
            {
                UserId = userId,
                Name = userName,
                Image = null, // Will be set later if available
                EligibleWeeks = eligibleWeeks,
            };

            var ticketsResponse = await _lotteryTicketService.SyncLotteryTicketsAsync(syncTicketsRequest);

            _logger.LogInformation(
                "Synced lottery tickets: {Synced} new, {Skipped} skipped",
                ticketsResponse.SyncedCount,
                ticketsResponse.SkippedCount);

            return new SyncHarvestResponse
            {
                WeeksSynced = weeksSynced,
                WeeksUpdated = weeksUpdated,
                TicketsSynced = ticketsResponse.SyncedCount,
                UserId = userId,
                UserName = userName,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing from Harvest");
            throw;
        }
    }

    public async Task<EmployeeWeeksResponse> GetEmployeeWeeksAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        // Get all weeks for user
        var allWeeks = await _employeeWeekRepository.GetByUserIdAsync(userId);
        
        // Filter to only return 2026 weeks
        var weeks = allWeeks.Where(w => w.WeekKey.StartsWith("2026-")).ToList();

        // Get all lottery tickets for user
        var tickets = await _lotteryTicketRepository.GetByUserIdAsync(userId);
        var ticketsByWeek = tickets.ToDictionary(t => t.EligibleWeek, t => t);

        // Get all winning tickets for user's weeks
        var weekKeys = weeks.Select(w => w.WeekKey).ToList();
        var allWinningTickets = await _winningTicketRepository.GetAllAsync();
        var winningTicketsByWeek = allWinningTickets
            .Where(wt => weekKeys.Contains(wt.Week))
            .GroupBy(wt => wt.Week)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Build DTOs with lottery/winner info
        var weekDtos = new List<EmployeeWeekDto>();

        foreach (var week in weeks)
        {
            var dto = week.ToDto();

            // Check if user has ticket for this week
            dto.HasTicket = ticketsByWeek.ContainsKey(week.WeekKey);

            // Check if winner has been drawn for this week
            var weekWinners = winningTicketsByWeek.GetValueOrDefault(week.WeekKey);
            dto.WinnerDrawn = weekWinners != null && weekWinners.Count > 0;

            // Check if user won this week and set winner info
            if (weekWinners != null && weekWinners.Count > 0)
            {
                var userWon = weekWinners.Any(w => w.UserId == userId);
                dto.HasWon = userWon;

                // If user won, show their winning ticket; otherwise show the first winner
                var winningTicket = userWon
                    ? weekWinners.First(w => w.UserId == userId)
                    : weekWinners.First();
                
                var winnerDto = winningTicket.ToDto();
                winnerDto.WinningTicketId = winningTicket.Id;
                
                // Check if prize has been claimed for this winning ticket
                var existingTransaction = await _giftcardTransactionRepository.GetByWinningTicketIdAsync(winningTicket.Id);
                winnerDto.PrizeClaimed = existingTransaction != null;
                
                dto.Winner = winnerDto;
            }

            // Calculate countdown target (Friday 15:00 of that week)
            dto.CountdownTarget = CalculateCountdownTarget(week.WeekEnd);

            weekDtos.Add(dto);
        }

        return new EmployeeWeeksResponse
        {
            Weeks = weekDtos,
        };
    }


    private List<WeekData> GroupEntriesByWeek(List<HarvestApiService.HarvestTimeEntry> timeEntries)
    {
        var weeksDict = new Dictionary<string, WeekData>();

        foreach (var entry in timeEntries)
        {
            // Parse spent_date (YYYY-MM-DD format) as UTC
            if (!DateTime.TryParseExact(entry.SpentDate, "yyyy-MM-dd", null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var entryDate))
            {
                _logger.LogWarning("Invalid date format: {SpentDate}", entry.SpentDate);
                continue;
            }
            // Ensure it's UTC
            entryDate = new DateTime(entryDate.Year, entryDate.Month, entryDate.Day, 0, 0, 0, DateTimeKind.Utc);

            // Get ISO week number and year
            var weekNumber = ISOWeek.GetWeekOfYear(entryDate);
            var weekYear = ISOWeek.GetYear(entryDate);

            // Create week key: "2024-W01"
            var weekKey = $"{weekYear}-W{weekNumber:D2}";

            if (!weeksDict.ContainsKey(weekKey))
            {
                // Calculate Monday and Friday of this ISO week
                // Ensure entryDate is UTC for calculations
                var utcEntryDate = entryDate.Kind == DateTimeKind.Utc 
                    ? entryDate 
                    : new DateTime(entryDate.Year, entryDate.Month, entryDate.Day, 0, 0, 0, DateTimeKind.Utc);
                var monday = GetMondayOfISOWeek(utcEntryDate);
                var friday = new DateTime(monday.Year, monday.Month, monday.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(4);

                weeksDict[weekKey] = new WeekData
                {
                    WeekKey = weekKey,
                    WeekStart = monday,
                    WeekEnd = friday,
                    Entries = new List<HarvestApiService.HarvestTimeEntry>(),
                };
            }

            weeksDict[weekKey].Entries.Add(entry);
        }

        // Calculate summaries for each week
        var weeksData = new List<WeekData>();
        foreach (var weekData in weeksDict.Values)
        {
            // Calculate total hours
            weekData.Hours = weekData.Entries.Sum(e => e.Hours);

            // Calculate billable hours (entries with client)
            weekData.BillableHours = weekData.Entries
                .Where(e => e.Client != null)
                .Sum(e => e.Hours);

            // Check lottery eligibility
            weekData.IsLotteryEligible = CheckLotteryEligibility(weekData.Entries, weekData.WeekEnd);

            weeksData.Add(weekData);
        }

        // Sort by week (newest first)
        weeksData.Sort((a, b) => b.WeekKey.CompareTo(a.WeekKey));

        return weeksData;
    }

    private DateTime GetMondayOfISOWeek(DateTime date)
    {
        // ISO week starts on Monday
        // Get the Monday of the ISO week containing this date
        // Ensure we're working with UTC dates
        var utcDate = date.Kind == DateTimeKind.Utc ? date : date.ToUniversalTime();
        var dayOfWeek = (int)utcDate.DayOfWeek;
        // Convert to ISO day of week (Monday = 1, Sunday = 7)
        var isoDayOfWeek = dayOfWeek == 0 ? 7 : dayOfWeek;
        var daysToSubtract = isoDayOfWeek - 1;
        var monday = utcDate.AddDays(-daysToSubtract).Date;
        // Return as UTC DateTime
        return new DateTime(monday.Year, monday.Month, monday.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    private bool CheckLotteryEligibility(List<HarvestApiService.HarvestTimeEntry> entries, DateTime fridayDate)
    {
        // Ensure it's a Friday
        if (fridayDate.DayOfWeek != DayOfWeek.Friday)
        {
            _logger.LogWarning("Provided date {Date} is not a Friday", fridayDate);
            return false;
        }

        // Set cutoff time to Friday 15:00 UTC
        var cutoffTime = new DateTime(fridayDate.Year, fridayDate.Month, fridayDate.Day, 15, 0, 0, DateTimeKind.Utc);

        // Get Monday of the week (ensure UTC)
        var utcFriday = fridayDate.Kind == DateTimeKind.Utc 
            ? fridayDate 
            : fridayDate.ToUniversalTime();
        var monday = new DateTime(utcFriday.Year, utcFriday.Month, utcFriday.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(-4);

        // Group entries by date
        var dailyHours = new Dictionary<DateTime, DailyHoursData>();

        // Initialize all weekdays (as UTC)
        for (int i = 0; i < 5; i++)
        {
            var date = new DateTime(monday.Year, monday.Month, monday.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(i);
            dailyHours[date] = new DailyHoursData { Hours = 0, LastUpdated = null };
        }

        DateTime? latestEntryTime = null;

        // Process entries
        foreach (var entry in entries)
        {
            // Parse spent_date (YYYY-MM-DD format) as UTC
            if (!DateTime.TryParseExact(entry.SpentDate, "yyyy-MM-dd", null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var entryDate))
            {
                continue;
            }

            // Ensure it's UTC
            entryDate = new DateTime(entryDate.Year, entryDate.Month, entryDate.Day, 0, 0, 0, DateTimeKind.Utc);

            // Only process entries from Monday-Friday of this week (compare UTC dates)
            if (entryDate >= monday && entryDate <= utcFriday && 
                entryDate.DayOfWeek >= DayOfWeek.Monday && entryDate.DayOfWeek <= DayOfWeek.Friday)
            {
                if (!dailyHours.ContainsKey(entryDate))
                {
                    dailyHours[entryDate] = new DailyHoursData { Hours = 0, LastUpdated = null };
                }

                dailyHours[entryDate].Hours += entry.Hours;

                // Track latest update time
                var entryLatest = entry.CreatedAt > entry.UpdatedAt ? entry.CreatedAt : entry.UpdatedAt;
                if (dailyHours[entryDate].LastUpdated == null || entryLatest > dailyHours[entryDate].LastUpdated)
                {
                    dailyHours[entryDate].LastUpdated = entryLatest;
                }

                if (latestEntryTime == null || entryLatest > latestEntryTime)
                {
                    latestEntryTime = entryLatest;
                }
            }
        }

        // Check eligibility criteria:
        // 1. Total hours (Mon-Fri) must be at least 40 hours
        // 2. All entries must be finalized (created AND updated) before Friday 15:00
        double totalHours = dailyHours.Values.Sum(d => d.Hours);
        bool meetsTotalHoursRequirement = totalHours >= 40;
        bool allEntriesBeforeCutoff = true;

        foreach (var dayData in dailyHours.Values)
        {
            if (dayData.LastUpdated.HasValue && dayData.LastUpdated.Value > cutoffTime)
            {
                allEntriesBeforeCutoff = false;
            }
        }

        if (latestEntryTime.HasValue && latestEntryTime.Value > cutoffTime)
        {
            allEntriesBeforeCutoff = false;
        }

        return meetsTotalHoursRequirement && allEntriesBeforeCutoff;
    }

    private DateTime? CalculateCountdownTarget(DateTime weekEnd)
    {
        // Countdown target is Friday 15:00 of that week (Norway time, Europe/Oslo)
        // Create DateTime for 15:00 in Norway timezone, then convert to UTC
        var norwayTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Oslo");
        var norwayTime = new DateTime(weekEnd.Year, weekEnd.Month, weekEnd.Day, 15, 0, 0, DateTimeKind.Unspecified);
        var utcTime = TimeZoneInfo.ConvertTimeToUtc(norwayTime, norwayTimeZone);
        return utcTime;
    }

    private class WeekData
    {
        public string WeekKey { get; set; } = string.Empty;
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public List<HarvestApiService.HarvestTimeEntry> Entries { get; set; } = new();
        public double Hours { get; set; }
        public double BillableHours { get; set; }
        public bool IsLotteryEligible { get; set; }
    }

    private class DailyHoursData
    {
        public double Hours { get; set; }
        public DateTime? LastUpdated { get; set; }
    }
}

using Fortedle.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fortedle.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees { get; set; }
    public DbSet<LeaderboardEntry> LeaderboardEntries { get; set; }
    public DbSet<Round> Rounds { get; set; }
    public DbSet<LotteryTicket> LotteryTickets { get; set; }
    public DbSet<WinningTicket> WinningTickets { get; set; }
    public DbSet<MonthlyWinningTicket> MonthlyWinningTickets { get; set; }
    public DbSet<LotteryConfig> LotteryConfigs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Employee entity
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Teams)
                .HasColumnType("text[]")
                .HasDefaultValue(new List<string>());
            entity.Property(e => e.Interests)
                .HasColumnType("text[]")
                .HasDefaultValue(new List<string>());
            entity.HasIndex(e => e.UpdatedAt)
                .HasDatabaseName("idx_employees_updated_at");
        });

        // Configure LeaderboardEntry entity
        modelBuilder.Entity<LeaderboardEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PlayerName, e.Date })
                .IsUnique();
            entity.HasIndex(e => e.Date)
                .HasDatabaseName("idx_leaderboard_date");
            entity.HasIndex(e => new { e.Date, e.Score })
                .HasDatabaseName("idx_leaderboard_date_score");
        });

        // Configure Round entity
        modelBuilder.Entity<Round>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Date })
                .IsUnique()
                .HasDatabaseName("idx_rounds_user_date");
            entity.HasIndex(e => e.Date)
                .HasDatabaseName("idx_rounds_date");
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("idx_rounds_user_id");
        });

        // Configure LotteryTicket entity
        modelBuilder.Entity<LotteryTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.EligibleWeek })
                .IsUnique()
                .HasDatabaseName("idx_lottery_tickets_user_week");
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("idx_lottery_tickets_user_id");
            entity.HasIndex(e => e.EligibleWeek)
                .HasDatabaseName("idx_lottery_tickets_eligible_week");
            entity.HasIndex(e => e.IsUsed)
                .HasDatabaseName("idx_lottery_tickets_is_used");
        });

        // Configure WinningTicket entity
        modelBuilder.Entity<WinningTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("idx_winning_tickets_user_id");
            entity.HasIndex(e => e.LotteryTicketId)
                .HasDatabaseName("idx_winning_tickets_lottery_ticket_id");
            entity.HasIndex(e => e.Week)
                .HasDatabaseName("idx_winning_tickets_week");
            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("idx_winning_tickets_created_at");
        });

        // Configure MonthlyWinningTicket entity
        modelBuilder.Entity<MonthlyWinningTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Month)
                .HasDatabaseName("idx_monthly_winning_tickets_month");
            entity.HasIndex(e => new { e.Month, e.Position })
                .IsUnique()
                .HasDatabaseName("idx_monthly_winning_tickets_month_position");
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("idx_monthly_winning_tickets_user_id");
        });

        // Configure LotteryConfig entity
        modelBuilder.Entity<LotteryConfig>(entity =>
        {
            entity.HasKey(e => e.Key);
        });
    }
}


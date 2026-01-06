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
    }
}


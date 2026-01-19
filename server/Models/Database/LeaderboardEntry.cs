using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("leaderboard")]
public class LeaderboardEntry
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [Column("player_name")]
    [MaxLength(255)]
    public string PlayerName { get; set; } = string.Empty;

    [Required]
    [Column("score")]
    public int Score { get; set; }

    [Required]
    [Column("date")]
    [DataType(DataType.Date)]
    public DateOnly Date { get; set; }

    [Column("avatar_image_url")]
    public string? AvatarImageUrl { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

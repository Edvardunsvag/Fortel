using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Data.Entities;

[Table("monthly_winning_tickets")]
public class MonthlyWinningTicket
{
    [Key]
    [Column("id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("image")]
    [MaxLength(500)]
    public string? Image { get; set; }

    [Required]
    [Column("month")]
    [MaxLength(10)]
    public string Month { get; set; } = string.Empty; // e.g., "2024-01"

    [Required]
    [Column("position")]
    public int Position { get; set; } // 1st, 2nd, 3rd place

    [Required]
    [Column("tickets_consumed")]
    public int TicketsConsumed { get; set; } // Number of tickets user had when won

    [Column("color")]
    [MaxLength(20)]
    public string? Color { get; set; } // Winner's wheel color for display

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

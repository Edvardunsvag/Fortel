using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("winning_tickets")]
public class WinningTicket
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
    [Column("lottery_ticket_id")]
    public int LotteryTicketId { get; set; }

    [Required]
    [Column("week")]
    [MaxLength(20)]
    public string Week { get; set; } = string.Empty; // e.g., "2024-W01"

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey(nameof(LotteryTicketId))]
    public LotteryTicket? LotteryTicket { get; set; }
}

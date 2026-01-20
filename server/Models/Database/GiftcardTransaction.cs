using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("giftcard_transactions")]
public class GiftcardTransaction
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
    [Column("employee_name")]
    [MaxLength(255)]
    public string EmployeeName { get; set; } = string.Empty;

    [Required]
    [Column("employee_email")]
    [EmailAddress]
    [MaxLength(255)]
    public string EmployeeEmail { get; set; } = string.Empty;

    [Column("employee_phone")]
    [MaxLength(50)]
    public string? EmployeePhone { get; set; }

    [Required]
    [Column("amount")]
    [Range(1, 100000)]
    public int Amount { get; set; }

    [Required]
    [Column("currency")]
    [MaxLength(3)]
    public string Currency { get; set; } = "NOK";

    [Required]
    [Column("reason")]
    [MaxLength(255)]
    public string Reason { get; set; } = string.Empty; // e.g., "weekly_lottery_winner", "monthly_lottery_winner", "manual"

    [Required]
    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, sent, failed

    [Column("glede_order_id")]
    [MaxLength(255)]
    public string? GledeOrderId { get; set; }

    [Column("glede_gift_id")]
    [MaxLength(255)]
    public string? GledeGiftId { get; set; }

    [Column("glede_gift_link")]
    [MaxLength(500)]
    public string? GledeGiftLink { get; set; }

    [Column("error_message")]
    public string? ErrorMessage { get; set; }

    [Column("message")]
    public string? Message { get; set; }

    [Column("sender_name")]
    [MaxLength(255)]
    public string? SenderName { get; set; }

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("sent_at")]
    public DateTime? SentAt { get; set; }

    // Optional link to weekly winning ticket
    [Column("winning_ticket_id")]
    public int? WinningTicketId { get; set; }

    // Optional link to monthly winning ticket
    [Column("monthly_winning_ticket_id")]
    public int? MonthlyWinningTicketId { get; set; }

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public Employee? Employee { get; set; }

    [ForeignKey(nameof(WinningTicketId))]
    public WinningTicket? WinningTicket { get; set; }

    [ForeignKey(nameof(MonthlyWinningTicketId))]
    public MonthlyWinningTicket? MonthlyWinningTicket { get; set; }
}

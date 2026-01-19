using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("employee_weeks")]
public class EmployeeWeek
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
    [Column("week_key")]
    [MaxLength(20)]
    public string WeekKey { get; set; } = string.Empty; // e.g., "2024-W01"

    [Required]
    [Column("week_start")]
    public DateTime WeekStart { get; set; } // Monday date

    [Required]
    [Column("week_end")]
    public DateTime WeekEnd { get; set; } // Friday date

    [Required]
    [Column("hours")]
    public double Hours { get; set; } // Total hours

    [Required]
    [Column("billable_hours")]
    public double BillableHours { get; set; } // Hours at client

    [Required]
    [Column("is_lottery_eligible")]
    public bool IsLotteryEligible { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

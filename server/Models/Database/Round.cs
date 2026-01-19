using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("rounds")]
public class Round
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
    [Column("date")]
    [DataType(DataType.Date)]
    public DateOnly Date { get; set; }

    [Required]
    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "started"; // started, finished, won, lost

    [Column("employee_of_the_day_id")]
    [MaxLength(255)]
    public string? EmployeeOfTheDayId { get; set; }

    [Column("guesses")]
    public string GuessesJson { get; set; } = "[]"; // JSON array of guesses

    [Column("funfact_revealed")]
    public bool FunfactRevealed { get; set; } = false;

    [Column("started_at")]
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    [Column("finished_at")]
    public DateTime? FinishedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

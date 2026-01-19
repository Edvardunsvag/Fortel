using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("lottery_config")]
public class LotteryConfig
{
    [Key]
    [Column("key")]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [Column("value")]
    [MaxLength(500)]
    public string Value { get; set; } = string.Empty;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

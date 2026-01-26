using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("harvest_tokens")]
public class HarvestToken
{
    [Key]
    [Column("user_id")]
    [MaxLength(255)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [Column("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [Required]
    [Column("refresh_token")]
    public string RefreshToken { get; set; } = string.Empty;

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Required]
    [Column("account_id")]
    [MaxLength(255)]
    public string AccountId { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

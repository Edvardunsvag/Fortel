using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fortedle.Server.Models.Database;

[Table("employees")]
public class Employee
{
    [Key]
    [Column("id")]
    [MaxLength(255)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("first_name")]
    [MaxLength(255)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [Column("surname")]
    [MaxLength(255)]
    public string Surname { get; set; } = string.Empty;

    [Required]
    [Column("email")]
    [EmailAddress]
    public string? Email { get; set; }

    [Column("avatar_image_url")]
    public string? AvatarImageUrl { get; set; }

    [Required]
    [Column("department")]
    [MaxLength(255)]
    public string Department { get; set; } = string.Empty;

    [Required]
    [Column("office")]
    [MaxLength(255)]
    public string Office { get; set; } = string.Empty;

    [Column("teams")]
    public List<string> Teams { get; set; } = new();

    [Column("age")]
    public int? Age { get; set; }

    [Column("supervisor")]
    [MaxLength(255)]
    public string? Supervisor { get; set; }

    [Column("funfact")]
    public string? Funfact { get; set; }

    [Column("interests")]
    public List<string> Interests { get; set; } = new();

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

using System.Text.Json.Serialization;

namespace Fortedle.Server.Models.DTOs;

public class EmployeeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarImageUrl { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Office { get; set; } = string.Empty;
    public List<string> Teams { get; set; } = new();
    public int? Age { get; set; }
    public string Supervisor { get; set; } = "-";
    public string? SupervisorLastname { get; set; }
    public string? Funfact { get; set; }
    public string? PhoneNumber { get; set; }
    public List<string> Interests { get; set; } = new();
    public string? Stillingstittel { get; set; }
}

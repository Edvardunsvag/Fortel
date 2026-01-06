namespace Fortedle.Server.Models;

public class EmployeeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? AvatarImageUrl { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Office { get; set; } = string.Empty;
    public List<string> Teams { get; set; } = new();
    public int? Age { get; set; }
    public string Supervisor { get; set; } = "-";
    public string? Funfact { get; set; }
    public List<string> Interests { get; set; } = new();
}


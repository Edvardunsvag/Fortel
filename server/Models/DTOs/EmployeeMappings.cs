using Fortedle.Server.Models.Database;

namespace Fortedle.Server.Models.DTOs;

public static class EmployeeExtensions
{
    public static EmployeeDto ToDto(this Employee entity)
    {
        return new EmployeeDto
        {
            Id = entity.Id,
            Name = entity.Name,
            FirstName = entity.FirstName,
            Surname = entity.Surname,
            Email = entity.Email ?? string.Empty,
            AvatarImageUrl = entity.AvatarImageUrl,
            Department = entity.Department,
            Office = entity.Office,
            Teams = entity.Teams ?? new List<string>(),
            Age = entity.Age,
            Supervisor = entity.Supervisor ?? "-",
            Funfact = entity.Funfact,
            Interests = entity.Interests ?? new List<string>(),
        };
    }
}

using Fortedle.Server.Models.Database;
using Fortedle.Server.Models.DTOs;
using Fortedle.Server.Repositories;
using System.Text.Json;

namespace Fortedle.Server.Services;

public interface ISyncService
{
    Task<SyncResponse> SyncEmployeesAsync(string accessToken);
}

public class SyncService : ISyncService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SyncService> _logger;

    public SyncService(
        IEmployeeRepository employeeRepository,
        IHttpClientFactory httpClientFactory,
        ILogger<SyncService> logger)
    {
        _employeeRepository = employeeRepository;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<SyncResponse> SyncEmployeesAsync(string accessToken)
    {
        var token = accessToken.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();

        // Handle token that might be pasted as JSON string (array format)
        if (token.StartsWith('[') || token.StartsWith('"'))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<JsonElement>(token);
                if (parsed.ValueKind == JsonValueKind.Array && parsed.GetArrayLength() > 0)
                {
                    token = parsed[0].GetString() ?? token;
                }
                else if (parsed.ValueKind == JsonValueKind.String)
                {
                    token = parsed.GetString() ?? token;
                }
            }
            catch
            {
                // If parsing fails, use the original token
            }
        }

        // Fetch employees from Huma API
        var userDetails = await FetchEmployeesFromHumaAsync(token);

        // Map to employee format
        var employees = userDetails.Select(MapHumaUserToEmployee).ToList();

        // Store in PostgreSQL using transaction with execution strategy
        // Clear existing employees
        await _employeeRepository.DeleteAllAsync();

        // Insert new employees
        foreach (var employee in employees)
        {
            var existingEmployee = await _employeeRepository.GetByIdAsync(employee.Id);
            if (existingEmployee != null)
            {
                // Update existing
                existingEmployee.Name = employee.Name;
                existingEmployee.FirstName = employee.FirstName;
                existingEmployee.Surname = employee.Surname;
                existingEmployee.Email = employee.Email;
                existingEmployee.AvatarImageUrl = employee.AvatarImageUrl;
                existingEmployee.Department = employee.Department;
                existingEmployee.Office = employee.Office;
                existingEmployee.Teams = employee.Teams;
                existingEmployee.Age = employee.Age;
                existingEmployee.Supervisor = employee.Supervisor;
                existingEmployee.Funfact = employee.Funfact;
                existingEmployee.Interests = employee.Interests;
                existingEmployee.UpdatedAt = DateTime.UtcNow;
                await _employeeRepository.UpdateAsync(existingEmployee);
            }
            else
            {
                // Insert new
                await _employeeRepository.AddAsync(employee);
            }
        }

        return new SyncResponse
        {
            Success = true,
            Message = $"Successfully synced {employees.Count} employees",
            Count = employees.Count,
        };
    }

    private async Task<List<JsonElement>> FetchEmployeesFromHumaAsync(string accessToken)
    {
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
        httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        var baseUrl = "https://api.humahr.com";

        // Fetch paginated list of users
        var paginationParams = new[]
        {
            new { offset = 0, limit = 50 },
            new { offset = 50, limit = 50 },
            new { offset = 100, limit = 50 },
        };

        var listDataTasks = paginationParams.Select(async param =>
        {
            var apiUrl = $"{baseUrl}/users?limit={param.limit}&offset={param.offset}&orderBy=name&orderDirection=asc";
            var response = await httpClient.GetAsync(apiUrl);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    throw new UnauthorizedAccessException("Authentication failed. Invalid access token.");
                }
                throw new HttpRequestException($"Failed to fetch employees: {response.StatusCode} {response.ReasonPhrase}");
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json);
            return result.GetProperty("items").EnumerateArray().ToList();
        });

        var listDataResults = await Task.WhenAll(listDataTasks);
        var allItems = listDataResults.SelectMany(x => x).ToList();

        // Filter active users
        var activeUserIds = allItems
            .Where(user => !user.TryGetProperty("status", out var status) || 
                          !status.TryGetProperty("active", out var active) || 
                          active.GetBoolean())
            .Select(user => user.GetProperty("id").GetString()!)
            .ToList();

        // Fetch detailed information for each user
        var userDetailTasks = activeUserIds.Select(async userId =>
        {
            var detailUrl = $"{baseUrl}/users/{userId}";
            try
            {
                var detailResponse = await httpClient.GetAsync(detailUrl);
                if (!detailResponse.IsSuccessStatusCode)
                {
                    if (detailResponse.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        throw new UnauthorizedAccessException("Authentication failed. Invalid access token.");
                    }
                    _logger.LogWarning("Failed to fetch details for user {UserId}: {StatusCode}", userId, detailResponse.StatusCode);
                    return (JsonElement?)null;
                }

                var json = await detailResponse.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<JsonElement>(json);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error fetching details for user {UserId}", userId);
                return null;
            }
        });

        var userDetails = await Task.WhenAll(userDetailTasks);
        return userDetails.Where(u => u.HasValue).Select(u => u!.Value).ToList();
    }

    private static Employee MapHumaUserToEmployee(JsonElement user)
    {
        // Helper to get string value from Huma API field format
        static string? GetStringValue(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Null || element.ValueKind == JsonValueKind.Undefined)
                return null;

            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty("value", out var value))
            {
                if (value.ValueKind == JsonValueKind.String)
                    return value.GetString();
                return null;
            }

            if (element.ValueKind == JsonValueKind.String)
                return element.GetString();

            return null;
        }

        // Helper to get array from Huma API field format
        static JsonElement? GetArrayValue(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Null || element.ValueKind == JsonValueKind.Undefined)
                return null;

            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty("value", out var value))
            {
                if (value.ValueKind == JsonValueKind.Array)
                    return value;
                return null;
            }

            if (element.ValueKind == JsonValueKind.Array)
                return element;

            return null;
        }

        // Helper to get object from Huma API field format
        static JsonElement? GetObjectValue(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Null || element.ValueKind == JsonValueKind.Undefined)
                return null;

            if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty("value", out var value))
            {
                if (value.ValueKind == JsonValueKind.Object)
                    return value;
                return null;
            }

            if (element.ValueKind == JsonValueKind.Object)
                return element;

            return null;
        }

        var givenName = GetStringValue(user.TryGetProperty("givenName", out var gn) ? gn : default) ?? string.Empty;
        var familyName = GetStringValue(user.TryGetProperty("familyName", out var fn) ? fn : default) ?? string.Empty;
        var preferredName = GetStringValue(user.TryGetProperty("preferredName", out var pn) ? pn : default);
        var name = preferredName ?? $"{givenName} {familyName}";
        var email = GetStringValue(user.TryGetProperty("email", out var e) ? e : default) ?? string.Empty;


        // Avatar image URL
        string? avatarImageUrl = null;
        if (user.TryGetProperty("avatarImage", out var avatarImage))
        {
            var avatarImageObj = GetObjectValue(avatarImage);
            if (avatarImageObj.HasValue && avatarImageObj.Value.TryGetProperty("url", out var url))
            {
                avatarImageUrl = url.GetString();
            }
        }
        
        if (avatarImageUrl == null && user.TryGetProperty("avatarUrl", out var avatarUrl))
        {
            avatarImageUrl = GetStringValue(avatarUrl);
        }

        // Teams
        var teamsArray = new List<string>();
        if (user.TryGetProperty("teams", out var teams))
        {
            var teamsValue = GetArrayValue(teams);
            if (teamsValue.HasValue)
            {
                teamsArray = teamsValue.Value.EnumerateArray()
                    .Select(team =>
                    {
                        if (team.ValueKind == JsonValueKind.Object && team.TryGetProperty("name", out var teamName))
                            return teamName.GetString() ?? string.Empty;
                        return team.GetString() ?? string.Empty;
                    })
                    .Where(t => !string.IsNullOrEmpty(t))
                    .ToList();
            }
        }
        var department = teamsArray.Count > 0 ? teamsArray[0] : "-";

        // Office/Location
        var office = "-";
        if (user.TryGetProperty("locations", out var locations))
        {
            var locationsValue = GetArrayValue(locations);
            if (locationsValue.HasValue && locationsValue.Value.GetArrayLength() > 0)
            {
                var firstLocation = locationsValue.Value[0];
                if (firstLocation.ValueKind == JsonValueKind.Object && 
                    firstLocation.TryGetProperty("name", out var locationName))
                {
                    office = locationName.GetString() ?? "-";
                }
            }
        }

        // Calculate age
        int? age = null;
        var birthDate = GetStringValue(user.TryGetProperty("birthDate", out var bd) ? bd : default);
        if (birthDate != null && DateTime.TryParse(birthDate, out var birth))
        {
            var today = DateTime.UtcNow;
            var calculatedAge = today.Year - birth.Year;
            if (today.Month < birth.Month || (today.Month == birth.Month && today.Day < birth.Day))
            {
                calculatedAge--;
            }
            age = calculatedAge;
        }

        // Supervisor
        var supervisor = "-";
        if (user.TryGetProperty("supervisor", out var supervisorData))
        {
            var supervisorObj = GetObjectValue(supervisorData);
            if (supervisorObj.HasValue)
            {
                var supervisorPreferredName = GetStringValue(supervisorObj.Value.TryGetProperty("preferredName", out var spn) ? spn : default);
                var supervisorGivenName = GetStringValue(supervisorObj.Value.TryGetProperty("givenName", out var sgn) ? sgn : default);
                var supervisorFamilyName = GetStringValue(supervisorObj.Value.TryGetProperty("familyName", out var sfn) ? sfn : default);

                supervisor = supervisorPreferredName ?? $"{supervisorGivenName} {supervisorFamilyName}".Trim();
                if (string.IsNullOrEmpty(supervisor))
                    supervisor = "-";
            }
        }

        // Funfact
        var funfact = GetStringValue(user.TryGetProperty("funfacts", out var ff) ? ff : default);

        // Interests
        var interestsArray = new List<string>();
        if (user.TryGetProperty("interests", out var interestsValue))
        {
            var interests = GetArrayValue(interestsValue);
            if (interests.HasValue)
            {
                interestsArray = interests.Value.EnumerateArray()
                    .Select(interest => interest.GetString())
                    .Where(interest => !string.IsNullOrEmpty(interest))
                    .ToList()!;
            }
        }

        return new Employee
        {
            Id = user.GetProperty("id").GetString() ?? string.Empty,
            Name = name,
            Email = email,
            FirstName = givenName,
            Surname = familyName,
            AvatarImageUrl = avatarImageUrl,
            Department = department,
            Office = office,
            Teams = teamsArray,
            Age = age,
            Supervisor = supervisor,
            Funfact = funfact,
            Interests = interestsArray,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }
}

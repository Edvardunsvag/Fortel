using Hangfire.Dashboard;

namespace Fortedle.Server;

/// <summary>
/// Dummy Hangfire dashboard authorization filter that always allows access.
/// Used when authorization is handled by ASP.NET Core endpoint authorization
/// (e.g. RequireAuthorization("HangfirePolicy")). Pass this (or an empty array)
/// in DashboardOptions.Authorization to disable Hangfire's default local-only filter.
/// </summary>
public class EmptyAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context) => true;
}

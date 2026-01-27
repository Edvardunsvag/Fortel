namespace Fortedle.Server.Services.Harvest;

public class HarvestConfiguration
{
    private readonly IConfiguration _configuration;

    public HarvestConfiguration(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string? GetClientId()
    {
        return _configuration["HARVEST_CLIENT_ID"] 
            ?? _configuration["Harvest:ClientId"];
    }

    public string? GetClientSecret()
    {
        return _configuration["HARVEST_CLIENT_SECRET"] 
            ?? _configuration["Harvest:ClientSecret"];
    }

    public string? GetRedirectUri()
    {
        return _configuration["HARVEST_REDIRECT_URI"] 
            ?? _configuration["Harvest:RedirectUri"];
    }

    public string? GetAccessToken()
    {
        return _configuration["Harvest:AccessToken"];
    }

    public string? GetAccountId()
    {
        return _configuration["Harvest:AccountId"];
    }

    public void ValidateOAuthConfig()
    {
        var clientId = GetClientId();
        var clientSecret = GetClientSecret();

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException(
                "Harvest ClientId and ClientSecret must be configured in appsettings.json or environment variables (HARVEST_CLIENT_ID, HARVEST_CLIENT_SECRET)");
        }
    }
}

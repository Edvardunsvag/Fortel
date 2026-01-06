namespace Fortedle.Server.Models;

public class SyncRequest
{
    public string AccessToken { get; set; } = string.Empty;
}

public class SyncResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Count { get; set; }
}


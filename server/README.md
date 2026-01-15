# Fortedle Server

Backend server for the Fortedle application built with .NET 8, handling data synchronization, employee data management, and game leaderboards.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- PostgreSQL database (version 12 or higher)
- Entity Framework Core tools (for migrations)

## Setup

### 1. Install .NET 8 SDK

If not already installed:

```bash
# macOS
brew install dotnet

# Or download from https://dotnet.microsoft.com/download/dotnet/8.0
```

Verify installation:

```bash
dotnet --version
```

### 2. Install Entity Framework Core Tools

```bash
dotnet tool install --global dotnet-ef
```

### 3. Set Up PostgreSQL Database

**Option A: Quick setup (database only, tables auto-created via migrations)**

```bash
# Create the database
createdb -U postgres fortedle

# Verify the database was created
psql -U postgres -l
```

# End of Selection

````

**Option B: Using the provided script**

```bash
# Run the database creation script
./create-db.sh
````

### 4. Configure Database Connection

The application supports multiple configuration methods (in order of precedence):

#### Method 1: Connection String in `appsettings.json`

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=fortedle;Username=postgres;Password=your_password;SSL Mode=Prefer"
  }
}
```

#### Method 2: Individual Database Settings in `appsettings.json`

```json
{
  "Database": {
    "Host": "localhost",
    "Port": 5432,
    "Database": "fortedle",
    "User": "postgres",
    "Password": "your_password"
  }
}
```

#### Method 3: Environment Variables (Recommended for Production)

Set the following environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fortedle
export DB_USER=postgres
export DB_PASSWORD=your_password
```

**Note:** For Azure PostgreSQL or remote databases, SSL mode is automatically set to `Require` with server certificate trust.

### 5. Configure CORS (Optional)

If you need to add additional allowed origins, edit `appsettings.json`:

```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "https://your-production-domain.com"]
  }
}
```

## Running the Server

### Development Mode

```bash
cd server
dotnet run
```

The server will:

- Start on `http://localhost:8080` (configured in `appsettings.json`)
- Automatically apply pending database migrations on startup
- Enable Swagger UI at `http://localhost:8080/swagger`

### Production Mode

```bash
# Build the project
dotnet build --configuration Release

# Run the application
dotnet run --configuration Release
```

### Using a Different Port

You can override the port using:

```bash
# Via environment variable
export PORT=3001
dotnet run

# Or modify appsettings.json
```

## Database Migrations

The application uses Entity Framework Core migrations for database schema management.

### Automatic Migrations

Migrations are **automatically applied** when the server starts. The system:

- Checks for pending migrations
- Applies them in chronological order
- Handles existing tables gracefully (won't fail if tables already exist)

### Manual Migration Management

#### Create a New Migration

When you modify entities in `Data/Entities/`, create a migration:

```bash
dotnet ef migrations add MigrationName --project Fortedle.Server.csproj
```

#### Apply Migrations Manually

```bash
dotnet ef database update --project Fortedle.Server.csproj
```

#### List Migrations

```bash
dotnet ef migrations list --project Fortedle.Server.csproj
```

#### Rollback a Migration

```bash
dotnet ef database update PreviousMigrationName --project Fortedle.Server.csproj
```

### Migration Files

Migration files are stored in the `Migrations/` directory:

- `YYYYMMDDHHMMSS_MigrationName.cs` - Migration code
- `YYYYMMDDHHMMSS_MigrationName.Designer.cs` - Migration metadata
- `AppDbContextModelSnapshot.cs` - Current model snapshot

## API Endpoints

### Health Check

**GET** `/health`

Returns the health status of the application and database connection.

**Response:**

```json
{
  "status": "Healthy",
  "checks": {
    "npgsql": {
      "status": "Healthy"
    }
  }
}
```

### Employees

**GET** `/api/employees`

Returns all employees from the database.

**Response:**

```json
[
  {
    "id": "123",
    "name": "John Doe",
    "firstName": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "avatarImageUrl": "https://...",
    "department": "Engineering",
    "office": "Oslo",
    "teams": ["Technology", "Experience Design"],
    "age": 32,
    "supervisor": "Jane Smith",
    "funfact": "Loves coffee",
    "interests": ["coding", "hiking"]
  }
]
```

### Sync

**POST** `/api/sync`

Syncs employee data from Huma API to PostgreSQL.

**Request Body:**

```json
{
  "accessToken": "your-huma-access-token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully synced 150 employees",
  "count": 150
}
```

**Error Responses:**

- `400 Bad Request` - Missing or invalid access token
- `401 Unauthorized` - Invalid or expired access token
- `500 Internal Server Error` - Server error during sync

### Leaderboard

**GET** `/api/leaderboard?date=YYYY-MM-DD`

Returns the leaderboard for a specific date. If no date is provided, returns today's leaderboard.

**Query Parameters:**

- `date` (optional) - Date in `YYYY-MM-DD` format

**Response:**

```json
{
  "date": "2024-01-15",
  "entries": [
    {
      "name": "John Doe",
      "score": 150,
      "rank": 1,
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**POST** `/api/leaderboard/submit-score`

Submits a score to the leaderboard.

**Request Body:**

```json
{
  "name": "John Doe",
  "score": 150,
  "date": "2024-01-15"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Score submitted successfully",
  "rank": 1
}
```

**Error Responses:**

- `400 Bad Request` - Missing name, invalid score, or invalid date format
- `500 Internal Server Error` - Server error

### Rounds

**GET** `/api/rounds`

Returns all game rounds.

**Response:**

```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "employeeId": "123",
    "employeeName": "John Doe"
  }
]
```

## API Documentation

The server includes Swagger/OpenAPI documentation:

- **Swagger UI**: `http://localhost:8080/swagger`
- **Swagger JSON**: `http://localhost:8080/swagger/v1/swagger.json`

Swagger UI provides:

- Interactive API testing
- Request/response schemas
- Authentication requirements
- Example requests

## Project Structure

```
server/
├── Controllers/              # API controllers
│   ├── EmployeesController.cs
│   ├── HealthController.cs
│   ├── LeaderboardController.cs
│   ├── RoundsController.cs
│   └── SyncController.cs
├── Data/                     # Data access layer
│   ├── Entities/            # Entity Framework entities
│   │   ├── Employee.cs
│   │   ├── LeaderboardEntry.cs
│   │   └── Round.cs
│   └── AppDbContext.cs      # Database context
├── Migrations/              # EF Core migrations
│   └── ...
├── Models/                  # DTOs and request/response models
│   ├── EmployeeDto.cs
│   ├── LeaderboardDto.cs
│   ├── RoundDto.cs
│   └── SyncRequest.cs
├── Services/                # Business logic services
│   ├── EmployeeService.cs
│   ├── LeaderboardService.cs
│   ├── RoundService.cs
│   └── SyncService.cs
├── Properties/              # Project properties
│   └── launchSettings.json
├── Program.cs               # Application entry point and configuration
├── appsettings.json         # Application configuration
└── Fortedle.Server.csproj   # Project file
```

## Configuration

### Application Settings

Key configuration sections in `appsettings.json`:

- **ConnectionStrings** - Database connection string
- **Database** - Individual database settings (alternative to connection string)
- **Kestrel** - Web server configuration (ports, HTTPS)
- **Cors** - CORS allowed origins
- **Logging** - Logging levels and providers

### Environment-Specific Configuration

Create environment-specific configuration files:

- `appsettings.Development.json` - Development settings
- `appsettings.Production.json` - Production settings

These files override `appsettings.json` based on the `ASPNETCORE_ENVIRONMENT` variable.

## CORS Configuration

CORS is configured to allow requests from:

- `http://localhost:5173` (default Vite dev server)
- Production domains (configured in `appsettings.json`)

To add more origins, update the `Cors:AllowedOrigins` array in `appsettings.json`.

## Health Checks

The application includes health checks for:

- **Database connectivity** - Verifies PostgreSQL connection

Access health status at `/health` endpoint.

## Logging

Logging is configured via `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

Logs are written to the console by default. In production, configure additional logging providers (file, Azure Application Insights, etc.).

## Troubleshooting

### Database Connection Issues

1. **Verify PostgreSQL is running:**

   ```bash
   psql -U postgres -c "SELECT version();"
   ```

2. **Check connection string:**
   - Verify credentials in `appsettings.json` or environment variables
   - Ensure database exists: `psql -U postgres -l | grep fortedle`

3. **Check SSL requirements:**
   - For local development: `SSL Mode=Prefer`
   - For Azure/remote: `SSL Mode=Require`

### Migration Issues

If migrations fail:

1. **Check migration history:**

   ```bash
   psql -U postgres -d fortedle -c "SELECT * FROM \"__EFMigrationsHistory\";"
   ```

2. **Verify pending migrations:**

   ```bash
   dotnet ef migrations list --project Fortedle.Server.csproj
   ```

3. **Manual migration application:**
   ```bash
   dotnet ef database update --project Fortedle.Server.csproj
   ```

### Port Already in Use

If port 8080 is already in use:

1. Change port in `appsettings.json`:

   ```json
   {
     "Kestrel": {
       "Endpoints": {
         "Http": {
           "Url": "http://localhost:3001"
         }
       }
     }
   }
   ```

2. Or use environment variable:
   ```bash
   export PORT=3001
   dotnet run
   ```

## Development

### Adding New Endpoints

1. Create a service interface in `Services/` (e.g., `IYourService.cs`)
2. Implement the service (e.g., `YourService.cs`)
3. Register the service in `Program.cs`:
   ```csharp
   builder.Services.AddScoped<IYourService, YourService>();
   ```
4. Create a controller in `Controllers/`
5. Inject the service via constructor

### Adding New Entities

1. Create entity class in `Data/Entities/`
2. Add to `AppDbContext.cs`:
   ```csharp
   public DbSet<YourEntity> YourEntities { get; set; }
   ```
3. Create migration:
   ```bash
   dotnet ef migrations add AddYourEntity --project Fortedle.Server.csproj
   ```
4. Apply migration (or let auto-migration handle it on startup)

## Dependencies

Key NuGet packages:

- **Npgsql.EntityFrameworkCore.PostgreSQL** (8.0.0) - PostgreSQL provider for EF Core
- **Microsoft.EntityFrameworkCore.Design** (8.0.0) - EF Core design-time tools
- **AspNetCore.HealthChecks.Npgsql** (8.0.0) - PostgreSQL health checks
- **Swashbuckle.AspNetCore** (6.5.0) - Swagger/OpenAPI support

## License

[Add your license information here]

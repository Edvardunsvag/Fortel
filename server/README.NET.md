# Fortedle Server (.NET)

Backend server for Fortedle-applikasjonen, migrert fra Node.js til .NET 8 med Entity Framework Core.

## Forutsetninger

- .NET 8 SDK
- PostgreSQL database (samme som Node.js-versjonen brukte)

## Oppsett

1. **Installer .NET 8 SDK** (hvis ikke allerede installert):
   ```bash
   # macOS
   brew install dotnet
   
   # Eller last ned fra https://dotnet.microsoft.com/download
   ```

2. **Konfigurer database** i `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=fortel;Username=postgres;Password=your_password;SSL Mode=Prefer"
     }
   }
   ```

   Eller bruk miljøvariabler i production (se `appsettings.Production.json`).

3. **Installer EF Core tools** (hvis ikke allerede installert):
   ```bash
   dotnet tool install --global dotnet-ef
   ```

## Database Migrations

### Opprett initial migration (kun første gang)

Siden du allerede har en database med data, må du:

1. **Opprett migration som matcher dagens schema:**
   ```bash
   dotnet ef migrations add InitialSchema --project Fortedle.Server.csproj
   ```

2. **Sjekk at migration-filen ser riktig ut** (den skal inneholde alle tabeller og kolonner)

3. **Marker migration som allerede kjørt** (IKKE kjør den faktisk!):
   ```bash
   # Først, sjekk hva migration ID-en er:
   dotnet ef migrations list
   
   # Deretter, manuelt INSERT i __EFMigrationsHistory tabellen:
   psql -U postgres -d fortel -c "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20240101000000_InitialSchema', '8.0.0') ON CONFLICT DO NOTHING;"
   ```
   
   Erstatt `20240101000000_InitialSchema` med faktisk migration ID fra `dotnet ef migrations list`.

4. **Fremtidige endringer:**
   Når du skal gjøre endringer på schema, opprett en ny migration:
   ```bash
   dotnet ef migrations add AddNewColumn --project Fortedle.Server.csproj
   dotnet ef database update --project Fortedle.Server.csproj
   ```

## Kjøre serveren

### Development
```bash
dotnet run --project Fortedle.Server.csproj
```

Serveren starter på `http://localhost:3001` (konfigurert i `appsettings.json`).

### Production
```bash
dotnet build --configuration Release
dotnet run --project Fortedle.Server.csproj --configuration Release
```

## API Endpoints

Samme som Node.js-versjonen:

- `GET /health` - Health check med database status
- `GET /api/employees` - Hent alle ansatte
- `GET /api/leaderboard?date=YYYY-MM-DD` - Hent leaderboard for en dato
- `POST /api/leaderboard` - Send inn score
- `POST /api/sync` - Sync ansatte fra Huma API

## Struktur

```
server/
├── Controllers/          # API controllers
├── Data/
│   ├── Entities/        # EF Core entities
│   └── AppDbContext.cs  # Database context
├── Models/              # DTOs og request/response modeller
├── Services/            # Business logic
├── Program.cs           # Application entry point
├── appsettings.json     # Konfigurasjon
└── Fortedle.Server.csproj
```

## Migrasjon fra Node.js

- `.env` → `appsettings.json` (allerede konvertert)
- `routes/*.js` → `Controllers/*.cs`
- `db/init.js` → EF Core migrations
- `pool.connect()` → Dependency Injection med `AppDbContext`

## CORS

CORS er konfigurert i `Program.cs` med samme origins som Node.js-versjonen.

## Health Checks

Health check endpoint inkluderer database connection status, akkurat som Node.js-versjonen.


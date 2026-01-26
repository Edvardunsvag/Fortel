---
description: Access the development database directly. Use when you need to query, inspect, or modify the database schema or data. Contains all connection details, environment variables, and common SQL commands needed for database operations.
alwaysApply: false
---

# Development Database Access

## Purpose
This command provides direct access to the development PostgreSQL database for:
- Querying data
- Inspecting schema
- Running diagnostic queries
- Testing database operations
- Verifying data integrity

## Connection Details

### Development Database (from appsettings.Development.json)
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `fortedle`
- **Username**: `postgres`
- **Password**: `password`
- **SSL Mode**: `Prefer`

### Connection String
```
Host=localhost;Port=5432;Database=fortedle;Username=postgres;Password=password;SSL Mode=Prefer
```

### Environment Variables
Set these environment variables to configure database access:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fortedle
export DB_USER=postgres
export DB_PASSWORD=password
```

## Quick Access Commands

### Connect to Database (Interactive psql)
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle
```

### Run Single SQL Query
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT version();"
```

### Run SQL from File
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -f query.sql
```

### Export Query Results to CSV
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT * FROM employees;" -A -F',' -o employees.csv
```

## Common Database Operations

### 1. List All Tables
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "\dt"
```

### 2. Describe Table Structure
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "\d employees"
```

### 3. Check Migration History
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c 'SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";'
```

### 4. Count Records in Table
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT COUNT(*) FROM employees;"
```

### 5. View Recent Records
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT * FROM employees ORDER BY \"UpdatedAt\" DESC LIMIT 10;"
```

## Database Tables (from AppDbContext)

The following tables exist in the database:
- `employees` - Employee data
- `leaderboard_entries` - Leaderboard entries
- `rounds` - Game rounds
- `lottery_tickets` - Lottery tickets
- `winning_tickets` - Weekly winning tickets
- `monthly_winning_tickets` - Monthly winning tickets
- `lottery_configs` - Lottery configuration
- `employee_weeks` - Employee week data
- `giftcard_transactions` - Gift card transactions
- `harvest_tokens` - Harvest OAuth tokens
- `__EFMigrationsHistory` - EF Core migration history

## Useful SQL Queries

### Get All Employees
```sql
SELECT * FROM employees ORDER BY name;
```

### Get Recent Rounds
```sql
SELECT * FROM rounds ORDER BY date DESC LIMIT 20;
```

### Get Lottery Tickets for User
```sql
SELECT * FROM lottery_tickets WHERE "UserId" = 'user-id-here' ORDER BY "EligibleWeek" DESC;
```

### Get Winning Tickets
```sql
SELECT * FROM winning_tickets ORDER BY "CreatedAt" DESC;
```

### Check Harvest Token Status
```sql
SELECT "UserId", "UpdatedAt", "ExpiresAt" FROM harvest_tokens;
```

### Get Employee Weeks
```sql
SELECT * FROM employee_weeks ORDER BY "WeekStart" DESC LIMIT 20;
```

## Using with Entity Framework Tools

### List Migrations
```bash
cd server
dotnet ef migrations list
```

### Check Pending Migrations
```bash
cd server
dotnet ef migrations list --no-build
```

### Apply Migrations
```bash
cd server
dotnet ef database update
```

### Generate Migration
```bash
cd server
dotnet ef migrations add MigrationName
```

## Using Environment Variables in Commands

When running commands, you can use environment variables:

```bash
# Set variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fortedle
export DB_USER=postgres
export DB_PASSWORD=password

# Use in psql command
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

## Security Notes

⚠️ **Important**: 
- This command contains development database credentials
- Never commit actual production credentials
- Use environment variables for production
- The password shown here is for local development only

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check if port 5432 is correct
- Verify database exists: `psql -U postgres -l`

### Authentication Failed
- Verify username and password match appsettings.Development.json
- Check PostgreSQL authentication settings in `pg_hba.conf`

### Database Does Not Exist
- Create database: `createdb -U postgres fortedle`
- Or run migrations: `cd server && dotnet ef database update`

## Example Workflows

### Inspect Employee Data
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT id, name, email FROM employees LIMIT 10;"
```

### Check Recent Activity
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT 'rounds' as table_name, COUNT(*) as count, MAX(date) as latest FROM rounds UNION ALL SELECT 'lottery_tickets', COUNT(*), MAX(\"CreatedAt\") FROM lottery_tickets;"
```

### Verify Schema
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "\d+ employees"
```

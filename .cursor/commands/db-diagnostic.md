---
description: Run comprehensive database diagnostics to check migration status, table existence, and schema state. Use when investigating database issues or verifying migration state. Contains all connection details and SQL queries needed to access the database directly.
alwaysApply: false
---

# Database Diagnostic

## Purpose
Run comprehensive diagnostics on the database to check:
- Applied migrations
- Table existence and structure
- Migration history state
- Potential migration issues

## Connection Details

### Development Database (from appsettings.json and appsettings.Development.json)
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `fortedle`
- **Username**: `postgres`
- **Password**: `password` (from appsettings.Development.json)
- **SSL Mode**: `Prefer`

### Connection String Format
```
Host=localhost;Port=5432;Database=fortedle;Username=postgres;Password=password;SSL Mode=Prefer
```

### Environment Variables (Alternative)
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: fortedle)
- `DB_USER` (default: postgres)
- `DB_PASSWORD` (default: password)

## Diagnostic Queries

### 1. Check Migration History (All Applied Migrations)
```sql
SELECT "MigrationId", "ProductVersion" 
FROM "__EFMigrationsHistory" 
ORDER BY "MigrationId";
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c 'SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";'
```

### 2. Check for Problematic Giftcard Migrations
```sql
SELECT "MigrationId" 
FROM "__EFMigrationsHistory" 
WHERE "MigrationId" LIKE '%Giftcard%' 
   OR "MigrationId" LIKE '%giftcard%'
   OR "MigrationId" LIKE '%20260120140548%'
   OR "MigrationId" LIKE '%20260120143921%';
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" WHERE "MigrationId" LIKE '\''%Giftcard%'\'' OR "MigrationId" LIKE '\''%giftcard%'\'';'
```

### 3. Check if giftcard_transactions Table Exists
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'giftcard_transactions'
);
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'giftcard_transactions');"
```

### 4. Get giftcard_transactions Table Structure
```sql
\d giftcard_transactions
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "\d giftcard_transactions"
```

### 5. List All Columns in giftcard_transactions (if exists)
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'giftcard_transactions'
ORDER BY ordinal_position;
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'giftcard_transactions' ORDER BY ordinal_position;"
```

### 6. Check Foreign Keys on giftcard_transactions
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'giftcard_transactions';
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'giftcard_transactions';"
```

### 7. List All Tables in Database
```sql
\dt
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "\dt"
```

### 8. Check EF Core Migration Status (Pending vs Applied)
```bash
cd server
dotnet ef migrations list --project Fortedle.Server.csproj
```

### 9. Test Database Connection
```sql
SELECT version();
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT version();"
```

### 10. Check for Missing Tables (Expected vs Actual)
Expected tables from AppDbContext:
- employees
- leaderboard_entries (or leaderboard)
- rounds
- lottery_tickets
- winning_tickets
- monthly_winning_tickets
- lottery_configs
- employee_weeks
- giftcard_transactions

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Command:**
```bash
PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d fortedle -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
```

## Production Database Access

For production, connection details should be in:
- Environment variables on Azure
- `appsettings.Production.json` (if exists)
- Azure App Service Configuration

**Production Connection Format:**
```bash
PGPASSWORD=<production-password> psql -h <production-host> -p 5432 -U <production-user> -d fortedle -c "<query>"
```

Or using connection string:
```bash
psql "Host=<host>;Port=5432;Database=fortedle;Username=<user>;Password=<password>;SSL Mode=Require" -c "<query>"
```

## Common Issues to Check

1. **Missing table but migration marked as applied** - Migration history shows migration but table doesn't exist
   - Check: Query 1 (migration history) vs Query 3 (table existence)
   
2. **Table exists but migration not in history** - Table was created manually or migration failed
   - Check: Query 3 (table exists) but not in Query 1 (migration history)
   
3. **Partial table structure** - Table exists but missing columns from later migrations
   - Check: Query 5 (columns) - should have: `winning_ticket_id`, `monthly_winning_ticket_id`
   
4. **Foreign key constraints missing** - Table exists but relationships not established
   - Check: Query 6 (foreign keys) - should reference `winning_tickets` and `monthly_winning_tickets`

## Output Interpretation

- **Migration list (Query 1)**: Shows what EF Core thinks is applied
- **EF Core status (Query 8)**: Shows pending vs applied from EF Core perspective
- **Table existence (Query 3)**: Confirms if table was created
- **Table structure (Query 4/5)**: Shows columns, indexes, and constraints
- **All tables (Query 7/10)**: Helps identify orphaned or missing tables
- **Foreign keys (Query 6)**: Verifies relationships are established

## Quick Diagnostic Checklist

When investigating migration issues, run these in order:
1. Query 9 - Verify connection works
2. Query 1 - See what migrations are applied
3. Query 8 - See what EF Core thinks is pending
4. Query 3 - Check if giftcard_transactions exists
5. If exists: Query 5 - Check column structure
6. If exists: Query 6 - Check foreign keys
7. Query 2 - Check for problematic migrations in history

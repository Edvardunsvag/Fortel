# Database Setup

This directory contains SQL scripts for setting up the PostgreSQL database.

## Quick Setup

### Option 1: Using psql (Recommended)

1. **Create the database:**
   ```bash
   # Connect to PostgreSQL as superuser
   psql -U postgres
   
   # Create the database
   CREATE DATABASE fortel;
   
   # Exit psql
   \q
   ```

2. **Run the setup script:**
   ```bash
   psql -U postgres -d fortel -f setup.sql
   ```

   Or if you want to run it interactively:
   ```bash
   psql -U postgres -d fortel
   ```
   Then copy and paste the contents of `setup.sql` (excluding the `\c fortel` line since you're already connected).

### Option 2: Using createdb command

```bash
# Create database
createdb -U postgres fortel

# Connect and run setup
psql -U postgres -d fortel -f setup.sql
```

### Option 3: Let the server create tables automatically

The server will automatically create the `employees` table when it starts, but you still need to create the database first:

```bash
# Create database only
createdb -U postgres fortel
```

Then start the server - it will create the table schema automatically.

## Environment Variables

Make sure your `.env` file in the `server` directory has the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fortel
DB_USER=postgres
DB_PASSWORD=your_password_here
```

## Verify Setup

To verify the database is set up correctly:

```bash
psql -U postgres -d fortel -c "\d employees"
```

This should show the structure of the `employees` table.

## Troubleshooting

### Database doesn't exist error
- Make sure PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql`
- Verify the database name matches in your `.env` file

### Permission denied
- Make sure your PostgreSQL user has the necessary permissions
- You may need to use `sudo` or connect as the `postgres` superuser

### Connection refused
- Check that PostgreSQL is running on the correct port (default: 5432)
- Verify `DB_HOST` in your `.env` file matches your PostgreSQL server location


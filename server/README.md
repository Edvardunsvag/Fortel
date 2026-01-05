# Fortedle Server

Backend server for the Fortedle application that handles data synchronization and employee data management.

## Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Set up PostgreSQL database:**

   **Option A: Quick setup (database only, tables auto-created)**
   ```bash
   # Create the database
   createdb -U postgres fortedle
   ```
   
   **Option B: Full setup with SQL script**
   ```bash
   # Create database and tables
   psql -U postgres -f db/setup.sql
   ```
   
   See `db/README.md` for detailed instructions.

3. **Create `.env` file:**
```bash
# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fortedle
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
EOF
```

   Or manually create `.env` with:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fortedle
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   PORT=3001
   ```

   **Note:** Replace `your_password_here` with your actual PostgreSQL password.

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## Database Migrations

Migrations are automatically run when the server starts. The system:
- Tracks which migrations have been executed in a `migrations` table
- Only runs new migration files (those starting with `migrate_` and ending with `.sql`)
- Runs migrations in alphabetical order

### Migration Files

Place migration files in the `db/` directory with the naming pattern:
- `migrate_YYYYMMDD_description.sql` (e.g., `migrate_20240115_add_new_column.sql`)

This ensures migrations run in chronological order.

### Manual Migration

To run migrations manually (useful for debugging):
```bash
npm run migrate
```

### Mark Existing Migrations as Executed

If you have migrations that were run before this system was implemented, you can mark them as already executed:

```bash
# Mark a specific migration as already executed
node -e "import('./db/migrations.js').then(m => m.markMigrationAsExecuted('migrate_skills_to_teams.sql'))"
```

This prevents the system from trying to run them again.

### How It Works

1. When the server starts, `initDatabase()` is called
2. After creating base tables, migrations are automatically executed
3. Each migration file is checked against the `migrations` table
4. Only new migrations are executed
5. All executed migrations are logged in the `migrations` table

## API Endpoints

### POST /api/sync
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

### GET /api/employees
Returns all employees from the PostgreSQL database.

**Response:**
```json
[
  {
    "id": "123",
    "name": "John Doe",
    "firstName": "John",
    "surname": "Doe",
    "avatarImageUrl": "https://...",
    "department": "Engineering",
    "office": "Oslo",
    "teams": ["Technology", "Experience Design"],
    "age": 32,
    "supervisor": "Jane Smith"
  },
  ...
]
```

## Database Schema

The `employees` table is automatically created on server startup with the following structure:

- `id` (VARCHAR, PRIMARY KEY)
- `name` (VARCHAR)
- `first_name` (VARCHAR)
- `surname` (VARCHAR)
- `avatar_image_url` (TEXT)
- `department` (VARCHAR)
- `office` (VARCHAR)
- `teams` (TEXT[])
- `age` (VARCHAR)
- `supervisor` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)


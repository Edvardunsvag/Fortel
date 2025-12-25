# Fortel Server

Backend server for the Fortel application that handles data synchronization and employee data management.

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
   createdb -U postgres fortel
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
DB_NAME=fortel
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
EOF
```

   Or manually create `.env` with:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fortel
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
    "skills": ["React", "TypeScript"],
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
- `skills` (TEXT[])
- `age` (VARCHAR)
- `supervisor` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)


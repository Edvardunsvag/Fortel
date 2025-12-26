import pg from 'pg';
const { Pool } = pg;

// Log database configuration (without password)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fortedle',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? '***' : 'not set',
};

console.log('Database configuration:', {
  ...dbConfig,
  password: dbConfig.password,
});

// Determine if we should use SSL (Azure PostgreSQL requires it)
const isAzurePostgres = process.env.DB_HOST && 
  !process.env.DB_HOST.includes('localhost') && 
  !process.env.DB_HOST.includes('127.0.0.1');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fortedle',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // SSL configuration for Azure PostgreSQL
  // Azure PostgreSQL requires SSL connections and uses self-signed certificates
  ssl: isAzurePostgres ? {
    // Azure PostgreSQL uses self-signed certificates, so we need to accept them
    rejectUnauthorized: false,
  } : false, // Disable SSL for local development
  // Connection pool settings for Azure
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export { pool };

/**
 * Initialize database schema
 */
export const initDatabase = async () => {
  console.log('Attempting to connect to database...');
  const client = await pool.connect();
  try {
    // Test connection first
    await client.query('SELECT NOW()');
    console.log('Database connection successful');

    console.log('Creating tables and indexes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        avatar_image_url TEXT,
        department VARCHAR(255) NOT NULL,
        office VARCHAR(255) NOT NULL,
        teams TEXT[] DEFAULT '{}',
        age VARCHAR(50),
        supervisor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updated_at);
    `);

    // Create leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255) NOT NULL,
        score INTEGER NOT NULL,
        date DATE NOT NULL,
        avatar_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_name, date)
      );
    `);

    // Add avatar_image_url column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'leaderboard' AND column_name = 'avatar_image_url'
        ) THEN
          ALTER TABLE leaderboard ADD COLUMN avatar_image_url TEXT;
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard(date);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_date_score ON leaderboard(date, score);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
    });
    throw error;
  } finally {
    client.release();
  }
};


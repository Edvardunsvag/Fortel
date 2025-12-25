import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fortel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export { pool };

/**
 * Initialize database schema
 */
export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        avatar_image_url TEXT,
        department VARCHAR(255) NOT NULL,
        office VARCHAR(255) NOT NULL,
        skills TEXT[] DEFAULT '{}',
        age VARCHAR(50),
        supervisor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updated_at);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};


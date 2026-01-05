import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create migrations table to track which migrations have been run
 */
const createMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_migrations_filename ON migrations(filename);
  `);
};

/**
 * Get list of migration files in order
 */
const getMigrationFiles = () => {
  const migrationsDir = __dirname;
  const files = readdirSync(migrationsDir)
    .filter(file => file.startsWith('migrate_') && file.endsWith('.sql'))
    .sort(); // Sort alphabetically to ensure consistent order
  
  return files;
};

/**
 * Check if a migration has already been executed
 */
const isMigrationExecuted = async (client, filename) => {
  const result = await client.query(
    'SELECT 1 FROM migrations WHERE filename = $1',
    [filename]
  );
  return result.rows.length > 0;
};

/**
 * Mark a migration as executed
 */
const markMigrationExecuted = async (client, filename) => {
  await client.query(
    'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
    [filename]
  );
};

/**
 * Manually mark a migration as executed (useful for migrations run before this system)
 */
export const markMigrationAsExecuted = async (filename) => {
  const client = await pool.connect();
  try {
    await createMigrationsTable(client);
    await markMigrationExecuted(client, filename);
    console.log(`✓ Marked ${filename} as already executed`);
  } catch (error) {
    console.error('Failed to mark migration as executed:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Run a single migration file
 */
const runMigration = async (client, filename) => {
  const filePath = join(__dirname, filename);
  const sql = readFileSync(filePath, 'utf8');
  
  console.log(`Running migration: ${filename}`);
  await client.query(sql);
  await markMigrationExecuted(client, filename);
  console.log(`✓ Migration ${filename} completed successfully`);
};

/**
 * Run all pending migrations
 */
export const runMigrations = async () => {
  const client = await pool.connect();
  try {
    console.log('Checking for pending migrations...');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable(client);
    
    // Get all migration files
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration file(s)`);
    
    // Run pending migrations
    let executedCount = 0;
    for (const filename of migrationFiles) {
      const alreadyExecuted = await isMigrationExecuted(client, filename);
      
      if (!alreadyExecuted) {
        await runMigration(client, filename);
        executedCount++;
      } else {
        console.log(`⊘ Migration ${filename} already executed, skipping`);
      }
    }
    
    if (executedCount === 0) {
      console.log('All migrations are up to date');
    } else {
      console.log(`✓ Successfully executed ${executedCount} migration(s)`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};


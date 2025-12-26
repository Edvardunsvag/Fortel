-- Create the Fortel database
-- Run this as a PostgreSQL superuser (usually 'postgres')

-- Create database (if it doesn't exist)
SELECT 'CREATE DATABASE fortel'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fortel')\gexec

-- Connect to the fortel database
\c fortel

-- Create employees table
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updated_at);

-- Verify table creation
\d employees


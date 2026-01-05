-- Migration script to add funfact and interests columns
-- Run this if you have an existing database

-- Add funfact column (TEXT, nullable)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS funfact TEXT;

-- Add interests column (TEXT[], nullable, default empty array)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';


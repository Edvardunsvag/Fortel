-- Migration script to rename skills column to teams
-- Run this if you have an existing database with the skills column
-- This migration is idempotent - safe to run multiple times

-- Rename the column from skills to teams (only if skills column exists and teams doesn't)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'skills'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'teams'
  ) THEN
    ALTER TABLE employees RENAME COLUMN skills TO teams;
  END IF;
END $$;


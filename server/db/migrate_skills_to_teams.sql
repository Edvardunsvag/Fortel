-- Migration script to rename skills column to teams
-- Run this if you have an existing database with the skills column

-- Rename the column from skills to teams
ALTER TABLE employees RENAME COLUMN skills TO teams;


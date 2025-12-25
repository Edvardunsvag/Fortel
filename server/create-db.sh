#!/bin/bash

# Script to create the Fortel PostgreSQL database
# Usage: ./create-db.sh [database_name] [user]

DB_NAME="${1:-fortel}"
DB_USER="${2:-postgres}"

echo "Creating PostgreSQL database: $DB_NAME"
echo "Using user: $DB_USER"
echo ""

# Check if database already exists
if psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Database '$DB_NAME' already exists."
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        dropdb -U "$DB_USER" "$DB_NAME"
    else
        echo "Keeping existing database. Exiting."
        exit 0
    fi
fi

# Create database
echo "Creating database '$DB_NAME'..."
createdb -U "$DB_USER" "$DB_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Database '$DB_NAME' created successfully!"
    echo ""
    echo "The server will automatically create the tables when it starts."
    echo "Or you can run the setup script:"
    echo "  psql -U $DB_USER -d $DB_NAME -f db/setup.sql"
else
    echo "✗ Failed to create database. Please check your PostgreSQL connection."
    exit 1
fi


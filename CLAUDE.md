# CLAUDE.md

This file is automatically loaded by Claude Code. Read the appropriate rules files based on what you're working on:

## Project Overview

Fortedle is an internal Wordle-like game where users guess the employee of the day. It's a full-stack application with a React frontend and .NET 8 backend.

## Rules Files

- **Frontend work** (`src/`, `*.ts`, `*.tsx`, `*.scss`): Read `.cursor/rules/frontend.mdc`
- **Backend work** (`server/`, `*.cs`): Read `.cursor/rules/backend.mdc`

When working on full-stack features, read both files.

## Quick Reference

### Commands

**Frontend (root directory):**
```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build (TypeScript + Vite)
npm test                 # Run tests in watch mode (Vitest)
npm run generate:api     # Generate TypeScript API client from Swagger
```

**Backend (server/ directory):**
```bash
cd server
dotnet run               # Run server (http://localhost:8080)
dotnet build             # Build
dotnet ef migrations add MigrationName  # Create migration
```

### Key Directories

- `src/app/` - Store, query client, typed hooks
- `src/features/` - Feature modules (auth, game, lottery, sidebar, i18n)
- `src/shared/` - Shared types, redux enums, API client, styles
- `server/Controllers/` - API endpoints
- `server/Services/` - Business logic
- `server/Data/Entities/` - EF Core entities

### Critical Patterns

1. **Enum imports (frontend)**: Import enums as values, not types
   ```typescript
   import { FeatureKey } from './types';  // CORRECT
   import type { FeatureKey } from './types';  // WRONG
   ```

2. **API client**: Always run `npm run generate:api` before implementing API types

3. **Git workflow**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Full Stack Development

Run both in separate terminals:
- Terminal 1: `npm run dev` (frontend)
- Terminal 2: `cd server && dotnet run` (backend)

# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Project Overview

Fortedle is an internal Wordle-like game where users guess the employee of the day. It's a full-stack application with a React frontend and .NET 8 backend.

## Commands

### Frontend (root directory)

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build (TypeScript + Vite)
npm test                 # Run tests in watch mode (Vitest)
npm run test:ci          # Run tests once (CI)
npm run lint             # ESLint (zero warnings allowed)
npm run format           # Format with Prettier
npm run generate:api     # Generate TypeScript API client from Swagger (requires server running)
```

### Backend (server/ directory)

```bash
cd server
dotnet run                                    # Run server (http://localhost:8080, auto-applies migrations)
dotnet build --configuration Release          # Production build
dotnet ef migrations add MigrationName        # Create new migration
dotnet ef database update                     # Apply migrations manually
```

### Full Stack Development

Run both in separate terminals:
- Terminal 1: `npm run dev` (frontend proxies API calls to localhost:8080)
- Terminal 2: `cd server && dotnet run`

## Architecture

### Frontend State Management

The frontend uses a dual state management pattern:

1. **Redux Toolkit** for client state (UI state, auth tokens, preferences)
   - Reducers keyed by `FeatureKey` enum in `src/app/store.ts`
   - Access state via `state[FeatureKey.<Feature>]`
   - Use typed hooks: `useAppDispatch`, `useAppSelector`

2. **TanStack Query v5** for server state (API data)
   - Query client in `src/app/queryClient.ts`
   - Query hooks in `queries.ts` files within features
   - Prefer TanStack Query over `createAsyncThunk` for API calls

### Feature Module Structure

Each feature in `src/features/<name>/` contains:
- `types.ts` - Domain types
- `api.ts` - Raw API functions (no UI code)
- `queries.ts` - TanStack Query hooks
- `<name>Slice.ts` - Redux slice with selectors
- Components and `index.ts` barrel exports

### Backend Structure

- ASP.NET Core 8 with Entity Framework Core
- PostgreSQL database with automatic migrations on startup
- Services layer for business logic (`server/Services/`)
- Swagger UI at `http://localhost:8080/swagger`

## Critical Patterns

### Enum Imports (CRITICAL)
Enums must be imported as values, not types:
```typescript
// CORRECT
import { FeatureKey } from './types';

// WRONG - causes ReferenceError at runtime
import type { FeatureKey } from './types';
```

### SCSS Imports
Use absolute paths from `src/` (configured via `loadPaths` in vite.config.ts):
```scss
// Works from any file depth
@use "shared/styles/variables.scss" as *;
```

### Redux State Access
Always use the FeatureKey enum:
```typescript
const gameState = state[FeatureKey.Game];
```

## Key Directories

- `src/app/` - Store, query client, typed hooks
- `src/features/` - Feature modules (auth, game, lottery, sidebar, i18n)
- `src/shared/` - Shared types, redux enums, API client, styles
- `server/Controllers/` - API endpoints
- `server/Services/` - Business logic
- `server/Data/Entities/` - EF Core entities

## Environment Setup

- Frontend: Request `.env` file from team, place in root
- Backend: Configure PostgreSQL connection in `server/appsettings.json` or via environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)

## Git Workflow

This project uses **Conventional Commits**. When asked to commit changes:

1. Run `git status` to see all changed files
2. Run `git diff` to review what will be committed
3. Create a new branch with a descriptive name based on the changes (e.g., `feat/add-timebank`, `fix/login-redirect`)
4. Write a conventional commit message:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation changes
   - `style:` formatting, no code change
   - `refactor:` code restructuring
   - `test:` adding/updating tests
   - `chore:` maintenance tasks
5. Create a pull request with a clear description of all changes

### Commit Message Format

```
<type>(<optional scope>): <description>

[optional body]
```

Examples:
- `feat(auth): add login timeout handling`
- `fix: resolve null pointer in game service`
- `docs: update README with env setup`

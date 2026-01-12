# Fortedle

An internal web application for Forte, inspired by Loldle. Guess the employee of the day!

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **SCSS Modules** - Styling

## Project Structure

```
src/
  app/                    # Redux store setup
    store.ts             # Store configuration
    hooks.ts             # Typed Redux hooks
    createAppAsyncThunk.ts # Typed async thunk helper
  features/              # Feature-based modules
    employees/           # Employee data feature
      types.ts
      api.ts
      employeesSlice.ts
      index.ts
    game/                # Game logic feature
      types.ts
      gameSlice.ts
      index.ts
  shared/                # Shared utilities
    redux/
      enums.ts           # FeatureKey, AsyncStatus
      types.ts           # Shared Redux types
  components/            # React components
    Game/
      Game.tsx
      GuessInput.tsx
      GuessList.tsx
      HintDisplay.tsx
      GameStatus.tsx
      *.module.scss
```

## Architecture

### Redux Pattern

- **One reducer per feature** - Each feature has its own slice
- **Feature-based organization** - Features are self-contained modules
- **Typed hooks** - `useAppDispatch` and `useAppSelector` with full type safety
- **Selectors over direct access** - All state access goes through selectors
- **FeatureKey enum** - Reducers are keyed by `FeatureKey` enum values

### Game Rules

- One employee of the day (selected deterministically based on date)
- Unlimited guesses per day
- Each guess provides hints:
  - **Department**: Correct/Incorrect
  - **Office**: Correct/Incorrect
  - **Skills**: Exact match / Some overlap / No overlap
  - **Seniority**: Higher / Lower / Equal
- Game state persists for the day
- New game starts automatically the next day

## Development

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## API Assumptions

The application assumes the following API endpoints exist:

- `GET /api/employees` - Returns an array of employee objects:
  ```typescript
  {
    id: string;
    name: string;
    department: string;
    office: string;
    skills: string[];
    seniority: number; // Higher = more senior
  }[]
  ```

## Daily Employee Selection

Currently, the employee of the day is selected randomly. In production, this should be:

- Deterministic based on the current date
- Consistent across all users for the same day
- Different each day

The `gameSlice` tracks the current date and resets the game when the date changes.

## Accessibility

- Semantic HTML elements
- Keyboard navigation support
- Visible focus states
- ARIA labels where needed
- Color is not the only indicator of state

## Future Enhancements

- Settings feature (theme, difficulty, etc.)
- Statistics tracking
- Share results
- Better daily employee selection algorithm
- More hint types

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { Employee } from '@/features/employees';
import type { GameState, Guess } from './types';
import { HintType, HintResult } from './types';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const initialState: GameState = {
  employeeOfTheDayId: null,
  guesses: [],
  status: 'idle',
  maxGuesses: 6,
  currentDate: getTodayDateString(),
};

const calculateHints = (
  guessed: Employee,
  target: Employee
): Guess['hints'] => {
  const hints: Guess['hints'] = [];

  // Department hint
  hints.push({
    type: HintType.Department,
    result:
      guessed.department === target.department
        ? HintResult.Correct
        : HintResult.Incorrect,
    message: guessed.department,
  });

  // Office hint
  hints.push({
    type: HintType.Office,
    result:
      guessed.office === target.office
        ? HintResult.Correct
        : HintResult.Incorrect,
    message: guessed.office,
  });

  // Teams hint - check for matches (exact, partial, or none)
  const guessedTeams = guessed.teams.map((t) => t.toLowerCase().trim()).filter(Boolean);
  const targetTeams = target.teams.map((t) => t.toLowerCase().trim()).filter(Boolean);
  const guessedTeamsStr = guessed.teams.join(', ') || '-';

  // Count matching teams
  const matchingTeams = guessedTeams.filter((team) => targetTeams.includes(team));
  const matchCount = matchingTeams.length;
  const guessedCount = guessedTeams.length;
  const targetCount = targetTeams.length;

  let teamsResult: HintResult;
  if (matchCount === 0) {
    // No teams match
    teamsResult = HintResult.Incorrect;
  } else if (matchCount === guessedCount && matchCount === targetCount) {
    // All teams match exactly
    teamsResult = HintResult.Correct;
  } else {
    // Some teams match (partial)
    teamsResult = HintResult.Partial;
  }

  hints.push({
    type: HintType.Teams,
    result: teamsResult,
    message: guessedTeamsStr,
  });

  // Age hint
  let ageResult: HintResult;
  let ageMessage: string;

  const guessedAge = typeof guessed.age === 'number' ? guessed.age : null;
  const targetAge = typeof target.age === 'number' ? target.age : null;

  if (guessedAge === null || targetAge === null) {
    ageResult = HintResult.None;
    ageMessage = typeof guessed.age === 'string' ? guessed.age : '-';
  } else if (guessedAge === targetAge) {
    ageResult = HintResult.Equal;
    ageMessage = guessedAge.toString();
  } else if (guessedAge > targetAge) {
    ageResult = HintResult.Higher;
    ageMessage = guessedAge.toString();
  } else {
    ageResult = HintResult.Lower;
    ageMessage = guessedAge.toString();
  }

  hints.push({
    type: HintType.Age,
    result: ageResult,
    message: ageMessage,
  });

  // Supervisor hint
  hints.push({
    type: HintType.Supervisor,
    result:
      guessed.supervisor && target.supervisor && guessed.supervisor !== '-' && target.supervisor !== '-'
        ? guessed.supervisor === target.supervisor
          ? HintResult.Correct
          : HintResult.Incorrect
        : HintResult.None,
    message: guessed.supervisor || '-',
  });

  return hints;
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    initializeGame: (state, action: PayloadAction<string>) => {
      const today = getTodayDateString();
      
      // Reset game if it's a new day
      if (state.currentDate !== today) {
        state.currentDate = today;
        state.guesses = [];
        state.status = 'playing';
      } else if (state.status === 'idle') {
        state.status = 'playing';
      }
      
      state.employeeOfTheDayId = action.payload;
    },
    makeGuess: (
      state,
      action: PayloadAction<{ guessed: Employee; target: Employee }>
    ) => {
      if (state.status !== 'playing') {
        return;
      }

      const { guessed, target } = action.payload;
      const isCorrect = guessed.id === target.id;
      const hints = calculateHints(guessed, target);

      const guess: Guess = {
        employeeId: guessed.id,
        employeeName: guessed.name,
        avatarImageUrl: guessed.avatarImageUrl,
        hints,
        isCorrect,
      };

      state.guesses.push(guess);

      if (isCorrect) {
        state.status = 'won';
      }
    },
  },
});

export const { initializeGame, makeGuess } = gameSlice.actions;

export const selectEmployeeOfTheDayId = (state: RootState): string | null =>
  state.game.employeeOfTheDayId;

export const selectGuesses = (state: RootState): Guess[] => state.game.guesses;

export const selectGameStatus = (state: RootState): GameState['status'] =>
  state.game.status;

export const selectCanGuess = (state: RootState): boolean =>
  state.game.status === 'playing';

export const gameReducer = gameSlice.reducer;


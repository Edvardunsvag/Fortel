import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { Employee } from '@/features/employees/types';
import type { GameState, Guess } from './types';
import { HintType, HintResult } from './types';
import { hashEmployeeId } from '@/shared/utils/hashUtils';
import { getTodayDateString } from '@/shared/utils/dateUtils';
import { createAppAsyncThunk } from '@/app/createAppAsyncThunk';
import * as roundApi from './api';

const initialState: GameState = {
  employeeOfTheDayId: null,
  guesses: [],
  status: 'idle',
  currentDate: getTodayDateString(),
  attemptedByUserId: null,
  attemptDate: null,
  funfactRevealed: false,
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

// Export calculateHints for use in components
export const calculateHintsForGuess = calculateHints;

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    loadRoundFromState: (state, action: PayloadAction<{ round: roundApi.RoundDto }>) => {
      const round = action.payload.round;
      const today = getTodayDateString();
      
      // Only load if it's for today
      if (round.date === today) {
        state.employeeOfTheDayId = round.employeeOfTheDayId;
        state.guesses = round.guesses
        state.status = round.status === 'won' ? 'won' : 'playing';
        state.funfactRevealed = round.funfactRevealed;
        state.attemptedByUserId = round.userId;
        state.attemptDate = round.date;
        state.currentDate = today;
      }
    },
    initializeGame: (state, action: PayloadAction<string>) => {
      const today = getTodayDateString();
      
      // Reset game if it's a new day
      if (state.currentDate !== today) {
        state.currentDate = today;
        state.guesses = [];
        state.status = 'playing';
        state.attemptedByUserId = null;
        state.attemptDate = null;
        state.funfactRevealed = false;
      } else if (state.status === 'idle') {
        state.status = 'playing';
      }
      
      // Store hashed employee ID
      const hashedId = hashEmployeeId(action.payload, today);
      state.employeeOfTheDayId = hashedId;
    },
    revealFunfact: (state) => {
      if (state.status !== 'playing' || state.funfactRevealed) {
        return;
      }
      
      // Cost 2 guesses - add two dummy guess entries
      const dummyGuess: Guess = {
        employeeId: '',
        employeeName: '',
        hints: [],
        isCorrect: false,
      };
      
      state.guesses.push(dummyGuess);
      state.guesses.push(dummyGuess);
      state.funfactRevealed = true;
    },
    makeGuess: (
      state,
      action: PayloadAction<{ guessed: Employee; target: Employee; userId?: string | null }>
    ) => {
      if (state.status !== 'playing') {
        return;
      }

      const { guessed, target, userId } = action.payload;
      
      // Verify guess against employeeOfTheDayId (hashed ID) - this is the source of truth
      const today = getTodayDateString();
      const guessedHashedId = hashEmployeeId(guessed.id, today);
      const isCorrect = guessedHashedId === state.employeeOfTheDayId;
      
      const hints = calculateHints(guessed, target);

      const guess: Guess = {
        employeeId: guessed.id,
        employeeName: guessed.name,
        avatarImageUrl: guessed.avatarImageUrl,
        hints,
        isCorrect,
      };

      state.guesses.push(guess);

      // Track attempt for logged-in users
      if (userId) {
        state.attemptedByUserId = userId;
        state.attemptDate = today;
      }

      if (isCorrect) {
        state.status = 'won';
      }
    },
  },
});

export const { initializeGame, revealFunfact, makeGuess, loadRoundFromState } = gameSlice.actions;

export const selectEmployeeOfTheDayId = (state: RootState): string | null =>
  state.game.employeeOfTheDayId;

export const selectFunfactRevealed = (state: RootState): boolean =>
  state.game.funfactRevealed;

const selectAllGuesses = (state: RootState): Guess[] => state.game.guesses;

export const selectGuesses = createSelector(
  [selectAllGuesses],
  (guesses): Guess[] => guesses.filter(guess => guess.employeeId !== '') // Filter out dummy guesses from revealFunfact
);

export const selectTotalGuesses = (state: RootState): number => 
  state.game.guesses.length; // Total guesses including reveal cost

export const selectGameStatus = (state: RootState): GameState['status'] =>
  state.game.status;

export const selectCanGuess = (state: RootState, isInLeaderboard?: boolean): boolean => {
  if (state.game.status !== 'playing') {
    return false;
  }

  // If user is in leaderboard, they can't guess
  if (isInLeaderboard) {
    return false;
  }

  return true;
};

export const selectHasAttemptedToday = (state: RootState, userId?: string | null): boolean => {
  if (!userId) {
    return false;
  }
  
  const today = getTodayDateString();
  return state.game.attemptedByUserId === userId && state.game.attemptDate === today;
};

// Async thunks for round management
export const loadRoundFromServer = createAppAsyncThunk(
  'game/loadRoundFromServer',
  async (params: { userId: string; date?: string }, { rejectWithValue, dispatch }) => {
    try {
      const round = await roundApi.getCurrentRound(params.userId, params.date);
      if (round) {
        dispatch(loadRoundFromState({ round }));
      }
      return round;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load round');
    }
  }
);

export const startRoundOnServer = createAppAsyncThunk(
  'game/startRoundOnServer',
  async (params: { userId: string; date?: string; employeeOfTheDayId?: string }, { rejectWithValue, dispatch }) => {
    try {
      const round = await roundApi.startRound(params);
      dispatch(loadRoundFromState({ round }));
      return round;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start round');
    }
  }
);

export const saveGuessToServer = createAppAsyncThunk(
  'game/saveGuessToServer',
  async (params: { userId: string; date?: string; guess: Guess; funfactRevealed?: boolean }, { rejectWithValue, dispatch }) => {
    try {
      const round = await roundApi.saveGuess(params);
      dispatch(loadRoundFromState({ round }));
      return round;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save guess');
    }
  }
);

export const finishRoundOnServer = createAppAsyncThunk(
  'game/finishRoundOnServer',
  async (params: { userId: string; date?: string; status: 'won' | 'lost' }, { rejectWithValue, dispatch }) => {
    try {
      const round = await roundApi.finishRound(params);
      dispatch(loadRoundFromState({ round }));
      return round;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to finish round');
    }
  }
);

export const gameReducer = gameSlice.reducer;


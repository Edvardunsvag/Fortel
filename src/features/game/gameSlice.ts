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
    message:
      guessed.department === target.department
        ? 'Correct department'
        : 'Wrong department',
  });

  // Office hint
  hints.push({
    type: HintType.Office,
    result:
      guessed.office === target.office
        ? HintResult.Correct
        : HintResult.Incorrect,
    message:
      guessed.office === target.office ? 'Correct office' : 'Wrong office',
  });

  // Skills hint
  const guessedSkills = new Set(guessed.skills.map((s) => s.toLowerCase()));
  const targetSkills = new Set(target.skills.map((s) => s.toLowerCase()));
  const intersection = new Set(
    [...guessedSkills].filter((s) => targetSkills.has(s))
  );
  const union = new Set([...guessedSkills, ...targetSkills]);

  let skillsResult: HintResult;
  let skillsMessage: string;

  if (intersection.size === union.size && intersection.size > 0) {
    skillsResult = HintResult.Correct;
    skillsMessage = 'Exact skill match';
  } else if (intersection.size > 0) {
    skillsResult = HintResult.Partial;
    skillsMessage = `Some skills overlap (${intersection.size} common)`;
  } else {
    skillsResult = HintResult.None;
    skillsMessage = 'No skill overlap';
  }

  hints.push({
    type: HintType.Skills,
    result: skillsResult,
    message: skillsMessage,
  });

  // Seniority hint
  let seniorityResult: HintResult;
  let seniorityMessage: string;

  if (guessed.seniority === target.seniority) {
    seniorityResult = HintResult.Equal;
    seniorityMessage = 'Equal seniority';
  } else if (guessed.seniority > target.seniority) {
    seniorityResult = HintResult.Higher;
    seniorityMessage = 'Higher seniority';
  } else {
    seniorityResult = HintResult.Lower;
    seniorityMessage = 'Lower seniority';
  }

  hints.push({
    type: HintType.Seniority,
    result: seniorityResult,
    message: seniorityMessage,
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
        hints,
        isCorrect,
      };

      state.guesses.push(guess);

      if (isCorrect) {
        state.status = 'won';
      } else if (state.guesses.length >= state.maxGuesses) {
        state.status = 'lost';
      }
    },
    resetGame: (state) => {
      state.guesses = [];
      state.status = 'idle';
      state.employeeOfTheDayId = null;
      state.currentDate = getTodayDateString();
    },
  },
});

export const { initializeGame, makeGuess, resetGame } = gameSlice.actions;

export const selectGameState = (state: RootState): GameState => state.game;

export const selectEmployeeOfTheDayId = (state: RootState): string | null =>
  state.game.employeeOfTheDayId;

export const selectGuesses = (state: RootState): Guess[] => state.game.guesses;

export const selectGameStatus = (state: RootState): GameState['status'] =>
  state.game.status;

export const selectRemainingGuesses = (state: RootState): number =>
  state.game.maxGuesses - state.game.guesses.length;

export const selectCanGuess = (state: RootState): boolean =>
  state.game.status === 'playing' &&
  state.game.guesses.length < state.game.maxGuesses;

export default gameSlice.reducer;


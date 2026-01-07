export { gameReducer, initializeGame, revealFunfact, makeGuess } from './gameSlice';
export {
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectGuesses,
  selectTotalGuesses,
  selectGameStatus,
  selectCanGuess,
} from './gameSlice';
export { HintType, HintResult } from './types';
export type { GameState, Guess, GuessHint } from './types';


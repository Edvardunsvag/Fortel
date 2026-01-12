export { gameReducer, initializeGame, revealFunfact, makeGuess, FUNFACT_REVEAL_COST } from "./gameSlice";
export {
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectGuesses,
  selectTotalGuesses,
  selectGameStatus,
  selectCanGuess,
} from "./gameSlice";
export { HintType, HintResult } from "./types";
export type { GameState, Guess, GuessHint } from "./types";

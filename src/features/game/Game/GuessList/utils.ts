import type { Guess, GuessHint } from "@/features/game/types";
import { HintType, HintResult } from "@/features/game/types";

// Animation configuration constants
export const ANIMATION_CONFIG = {
  BASE_DELAY: 400, // Base delay in ms
  DELAY_PER_BOX: 400, // Delay between each box
  BOXES_PER_GUESS: 5, // Number of boxes per guess
  NEW_GUESS_DELAY: 100, // Delay before triggering animation for new guess
} as const;

// Table column configuration
export const TABLE_COLUMNS = [
  { key: "employee", hintType: null },
  { key: "department", hintType: HintType.Department },
  { key: "office", hintType: HintType.Office },
  { key: "teams", hintType: HintType.Teams },
  { key: "age", hintType: HintType.Age },
  { key: "supervisor", hintType: HintType.Supervisor },
] as const;

/**
 * Helper functions to extract hint data from a guess
 */
export const getHintFromGuess = (guess: Guess, hintType: HintType): GuessHint | undefined => {
  return guess.hints.find((h) => h.type === hintType);
};

export const getHintValue = (guess: Guess, hintType: HintType): string => {
  return getHintFromGuess(guess, hintType)?.message || "";
};

export const getHintResult = (guess: Guess, hintType: HintType): HintResult => {
  return getHintFromGuess(guess, hintType)?.result || HintResult.Incorrect;
};

export const getHintArrow = (guess: Guess, hintType: HintType): { show: boolean; direction: "up" | "down" } => {
  const hint = getHintFromGuess(guess, hintType);
  if (hint?.result === HintResult.Higher) {
    return { show: true, direction: "down" };
  }
  if (hint?.result === HintResult.Lower) {
    return { show: true, direction: "up" };
  }
  return { show: false, direction: "up" };
};

export const calculateBoxDelay = (guessIndex: number, boxIndex: number, isAnimated: boolean): number => {
  if (!isAnimated) return -1;

  const guessOffset = guessIndex * ANIMATION_CONFIG.BOXES_PER_GUESS * ANIMATION_CONFIG.DELAY_PER_BOX;
  const boxOffset = boxIndex * ANIMATION_CONFIG.DELAY_PER_BOX;

  return ANIMATION_CONFIG.BASE_DELAY + guessOffset + boxOffset;
};

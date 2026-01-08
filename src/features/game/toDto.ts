import type {
  FortedleServerModelsGuessDto,
  FortedleServerModelsGuessHintDto,
  FortedleServerModelsRevealFunfactRequest,
  FortedleServerModelsSaveGuessRequest,
  FortedleServerModelsStartRoundRequest,
} from '@/shared/api/generated/index';
import type { Guess } from './types';

/**
 * Maps the application Guess type to the generated GuessDto
 */
export const guessToDto = (guess: Guess): FortedleServerModelsGuessDto => {
  return {
    employeeId: guess.employeeId,
    employeeName: guess.employeeName,
    avatarImageUrl: guess.avatarImageUrl ?? undefined,
    hints: guess.hints.map((hint): FortedleServerModelsGuessHintDto => ({
      type: hint.type,
      result: hint.result,
      message: hint.message,
    })),
    isCorrect: guess.isCorrect,
  };
};

/**
 * Maps application types to SaveGuessRequest
 */
export const toSaveGuessRequest = (
  userId: string,
  date: string | undefined,
  guess: Guess
): FortedleServerModelsSaveGuessRequest => {
  return {
    userId,
    date: date ?? undefined,
    guess: guessToDto(guess),
  };
};

/**
 * Maps application types to RevealFunfactRequest
 */
export const toRevealFunfactRequest = (
  roundId: number
): FortedleServerModelsRevealFunfactRequest => {
  return {
    roundId,
  };
};

/**
 * Maps application types to StartRoundRequest
 */
export const toStartRoundRequest = (
  userId: string,
  date: string | undefined,
  employeeOfTheDayId: string | undefined
): FortedleServerModelsStartRoundRequest => {
  return {
    userId,
    date: date ?? undefined,
    employeeOfTheDayId: employeeOfTheDayId ?? undefined,
  };
};


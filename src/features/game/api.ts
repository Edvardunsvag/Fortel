import { roundsApi } from '@/shared/api/client';
import type { Guess, HintType, HintResult } from './types';
import type {
  FortedleServerModelsRoundDto,
  FortedleServerModelsStartRoundRequest,
  FortedleServerModelsSaveGuessRequest,
  FortedleServerModelsFinishRoundRequest,
  FortedleServerModelsGuessDto,
  FortedleServerModelsGuessHintDto,
} from '@/shared/api/generated/index';

export interface RoundDto {
  id: number;
  userId: string;
  date: string;
  status: string;
  employeeOfTheDayId: string | null;
  guesses: Guess[];
  funfactRevealed: boolean;
  startedAt: string;
  finishedAt: string | null;
}

export interface StartRoundRequest {
  userId: string;
  date?: string;
  employeeOfTheDayId?: string;
}

export interface SaveGuessRequest {
  userId: string;
  date?: string;
  guess: Guess;
  funfactRevealed?: boolean;
}

export interface FinishRoundRequest {
  userId: string;
  date?: string;
  status: 'won' | 'lost';
}

/**
 * Maps the generated GuessDto to the application Guess type
 */
const mapGuessDto = (dto: FortedleServerModelsGuessDto): Guess => {
  return {
    employeeId: dto.employeeId ?? '',
    employeeName: dto.employeeName ?? '',
    avatarImageUrl: dto.avatarImageUrl ?? undefined,
    hints: (dto.hints ?? []).map((hint: FortedleServerModelsGuessHintDto) => ({
      type: hint.type as HintType,
      result: hint.result as HintResult,
      message: hint.message ?? '',
    })),
    isCorrect: dto.isCorrect ?? false,
  };
};

/**
 * Maps the generated RoundDto to the application RoundDto type
 */
const mapRoundDto = (dto: FortedleServerModelsRoundDto): RoundDto => {
  return {
    id: dto.id ?? 0,
    userId: dto.userId ?? '',
    date: dto.date ?? '',
    status: dto.status ?? '',
    employeeOfTheDayId: dto.employeeOfTheDayId ?? null,
    guesses: (dto.guesses ?? []).map(mapGuessDto),
    funfactRevealed: dto.funfactRevealed ?? false,
    startedAt: dto.startedAt ?? '',
    finishedAt: dto.finishedAt ?? null,
  };
};

/**
 * Maps the application Guess type to the generated GuessDto
 */
const mapGuessToDto = (guess: Guess): FortedleServerModelsGuessDto => {
  return {
    employeeId: guess.employeeId,
    employeeName: guess.employeeName,
    avatarImageUrl: guess.avatarImageUrl ?? undefined,
    hints: guess.hints.map((hint) => ({
      type: hint.type,
      result: hint.result,
      message: hint.message,
    })),
    isCorrect: guess.isCorrect,
  };
};

export const getCurrentRound = async (userId: string, date?: string): Promise<RoundDto | null> => {
  try {
    const response = await roundsApi.apiRoundsCurrentGet(userId, date);
    return mapRoundDto(response.data);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get current round: ${axiosError.response?.status}`);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to get current round'
    );
  }
};

export const startRound = async (request: StartRoundRequest): Promise<RoundDto> => {
  try {
    const apiRequest: FortedleServerModelsStartRoundRequest = {
      userId: request.userId,
      date: request.date ?? undefined,
      employeeOfTheDayId: request.employeeOfTheDayId ?? undefined,
    };
    
    const response = await roundsApi.apiRoundsStartPost(apiRequest);
    return mapRoundDto(response.data);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { statusText?: string } };
      throw new Error(`Failed to start round: ${axiosError.response?.statusText}`);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to start round'
    );
  }
};

export const saveGuess = async (request: SaveGuessRequest): Promise<RoundDto> => {
  try {
    const apiRequest: FortedleServerModelsSaveGuessRequest = {
      userId: request.userId,
      date: request.date ?? undefined,
      guess: mapGuessToDto(request.guess),
      funfactRevealed: request.funfactRevealed ?? undefined,
    };
    
    const response = await roundsApi.apiRoundsGuessPost(apiRequest);
    return mapRoundDto(response.data);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { statusText?: string } };
      throw new Error(`Failed to save guess: ${axiosError.response?.statusText}`);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to save guess'
    );
  }
};

export const finishRound = async (request: FinishRoundRequest): Promise<RoundDto> => {
  try {
    const apiRequest: FortedleServerModelsFinishRoundRequest = {
      userId: request.userId,
      date: request.date ?? undefined,
      status: request.status,
    };
    
    const response = await roundsApi.apiRoundsFinishPost(apiRequest);
    return mapRoundDto(response.data);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { statusText?: string } };
      throw new Error(`Failed to finish round: ${axiosError.response?.statusText}`);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to finish round'
    );
  }
};


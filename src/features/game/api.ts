import { getApiUrl } from '@/shared/utils/apiConfig';
import type { Guess } from './types';

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

export const getCurrentRound = async (userId: string, date?: string): Promise<RoundDto | null> => {
  const params = new URLSearchParams({ userId });
  if (date) {
    params.append('date', date);
  }

  const response = await fetch(getApiUrl(`api/rounds/current?${params.toString()}`));
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get current round: ${response.statusText}`);
  }

  return response.json();
};

export const startRound = async (request: StartRoundRequest): Promise<RoundDto> => {
  const response = await fetch(getApiUrl('api/rounds/start'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to start round: ${response.statusText}`);
  }

  return response.json();
};

export const saveGuess = async (request: SaveGuessRequest): Promise<RoundDto> => {
  const response = await fetch(getApiUrl('api/rounds/guess'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to save guess: ${response.statusText}`);
  }

  return response.json();
};

export const finishRound = async (request: FinishRoundRequest): Promise<RoundDto> => {
  const response = await fetch(getApiUrl('api/rounds/finish'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to finish round: ${response.statusText}`);
  }

  return response.json();
};


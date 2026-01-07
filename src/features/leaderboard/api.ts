import type { LeaderboardData } from './types';
import { leaderboardApi } from '@/shared/api/client';
import type {
  FortedleServerModelsLeaderboardDto,
  FortedleServerModelsSubmitScoreRequest,
  FortedleServerModelsLeaderboardEntryDto,
} from '@/shared/api/generated';

export interface SubmitScoreRequest {
  name: string;
  score: number;
  avatarImageUrl?: string;
}

/**
 * Maps the generated API DTO to the application LeaderboardData type
 */
const mapLeaderboardDto = (dto: FortedleServerModelsLeaderboardDto): LeaderboardData => {
  return {
    date: dto.date ?? '',
    leaderboard: (dto.leaderboard ?? []).map((entry: FortedleServerModelsLeaderboardEntryDto) => ({
      rank: entry.rank ?? 0,
      name: entry.name ?? '',
      score: entry.score ?? 0,
      avatarImageUrl: entry.avatarImageUrl ?? null,
      submittedAt: entry.submittedAt?.toString() ?? '',
    })),
  };
};

export const fetchLeaderboard = async (date?: string): Promise<LeaderboardData> => {
  try {
    const response = await leaderboardApi.apiLeaderboardGet(date);
    return mapLeaderboardDto(response.data);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string } };
      throw new Error(
        `Failed to fetch leaderboard: ${axiosError.response?.status} ${axiosError.response?.statusText}`
      );
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch leaderboard'
    );
  }
};

export const submitScore = async (
  request: SubmitScoreRequest
): Promise<LeaderboardData> => {
  try {
    const apiRequest: FortedleServerModelsSubmitScoreRequest = {
      name: request.name,
      score: request.score,
      avatarImageUrl: request.avatarImageUrl ?? undefined,
    };
    
    await leaderboardApi.apiLeaderboardPost(apiRequest);
    
    // Fetch the updated leaderboard after submission
    const leaderboardResponse = await leaderboardApi.apiLeaderboardGet();
    return mapLeaderboardDto(leaderboardResponse.data);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError.response?.data?.error || 'Failed to submit score';
      throw new Error(errorMessage);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to submit score'
    );
  }
};


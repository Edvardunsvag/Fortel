import { leaderboardApi } from '@/shared/api/client';
import type {
  FortedleServerModelsLeaderboardDto,
  FortedleServerModelsSubmitScoreRequest,
} from '@/shared/api/generated/index';

export const fetchLeaderboard = async (
  date?: string
): Promise<FortedleServerModelsLeaderboardDto> => {
  try {
    const response = await leaderboardApi.apiLeaderboardGet(date);
    return response.data;
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
  request: FortedleServerModelsSubmitScoreRequest
): Promise<FortedleServerModelsLeaderboardDto> => {
  try {
    await leaderboardApi.apiLeaderboardPost(request);
    
    // Fetch the updated leaderboard after submission
    const leaderboardResponse = await leaderboardApi.apiLeaderboardGet();
    return leaderboardResponse.data;
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


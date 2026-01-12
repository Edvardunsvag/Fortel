import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLeaderboard, submitScore } from './api';
import { leaderboardFromDto } from './fromDto';
import type { LeaderboardData } from './types';
import type { FortedleServerModelsSubmitScoreRequest } from '@/shared/api/generated/index';

// Query keys
export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  lists: () => [...leaderboardKeys.all, 'list'] as const,
  list: (date?: string) => [...leaderboardKeys.lists(), date] as const,
};

/**
 * Query hook for fetching leaderboard
 */
export const useLeaderboard = (date?: string) => {
  return useQuery<LeaderboardData>({
    queryKey: leaderboardKeys.list(date),
    queryFn: async () => {
      const apiLeaderboard = await fetchLeaderboard(date);
      return leaderboardFromDto(apiLeaderboard);
    },
  });
};

/**
 * Mutation hook for submitting a score
 */
export const useSubmitScore = () => {
  const queryClient = useQueryClient();

  return useMutation<LeaderboardData, Error, FortedleServerModelsSubmitScoreRequest>({
    mutationFn: async (request) => {
      const apiLeaderboard = await submitScore(request);
      return leaderboardFromDto(apiLeaderboard);
    },
    onSuccess: () => {
      // Invalidate and refetch leaderboard after successful submission
      queryClient.invalidateQueries({ queryKey: leaderboardKeys.lists() });
    },
  });
};

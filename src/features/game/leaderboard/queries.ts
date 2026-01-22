import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { fetchLeaderboard, submitScore } from "./api";
import { leaderboardFromDto } from "./fromDto";
import type { LeaderboardData } from "./types";
import type { FortedleServerModelsDTOsSubmitScoreRequest } from "@/shared/api/generated/index";

// Query keys
export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  lists: () => [...leaderboardKeys.all, "list"] as const,
  list: (date?: string) => [...leaderboardKeys.lists(), date] as const,
};

/**
 * Query hook for fetching leaderboard
 */
export const useLeaderboard = (date?: string) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<LeaderboardData>({
    queryKey: leaderboardKeys.list(date),
    queryFn: async () => {
      const apiLeaderboard = await fetchLeaderboard(date, accessToken);
      return leaderboardFromDto(apiLeaderboard);
    },
    enabled: !!accessToken, // Only fetch if we have a token
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for submitting a score
 */
export const useSubmitScore = () => {
  const queryClient = useQueryClient();
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<LeaderboardData, Error, FortedleServerModelsDTOsSubmitScoreRequest>({
    mutationFn: async (request) => {
      const apiLeaderboard = await submitScore(request, accessToken);
      return leaderboardFromDto(apiLeaderboard);
    },
    onSuccess: () => {
      // Invalidate and refetch leaderboard after successful submission
      queryClient.invalidateQueries({ queryKey: leaderboardKeys.lists() });
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

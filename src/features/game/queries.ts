import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { getCurrentRound, startRound, saveGuess, revealFunfact } from "./api";
import { roundFromDto } from "./fromDto";
import type { RoundDto } from "./fromDto";
import type {
  FortedleServerModelsDTOsStartRoundRequest,
  FortedleServerModelsDTOsSaveGuessRequest,
  FortedleServerModelsDTOsRevealFunfactRequest,
} from "@/shared/api/generated/index";

// Query keys
export const roundKeys = {
  all: ["rounds"] as const,
  current: (userId: string, date?: string) => [...roundKeys.all, "current", userId, date] as const,
};

/**
 * Query hook for fetching the current round
 */
export const useCurrentRound = (userId: string, date?: string, enabled = true) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<RoundDto | null>({
    queryKey: roundKeys.current(userId, date),
    queryFn: async () => {
      const apiRound = await getCurrentRound(userId, date, accessToken);
      if (apiRound) {
        return roundFromDto(apiRound);
      }
      return null;
    },
    enabled: enabled && !!accessToken, // Only fetch if enabled and we have a token
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
 * Mutation hook for starting a round
 */
export const useStartRound = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<RoundDto, Error, FortedleServerModelsDTOsStartRoundRequest>({
    mutationFn: async (request) => {
      const apiRound = await startRound(request, accessToken);
      return roundFromDto(apiRound);
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

/**
 * Mutation hook for saving a guess
 */
export const useSaveGuess = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<RoundDto, Error, FortedleServerModelsDTOsSaveGuessRequest>({
    mutationFn: async (request) => {
      const apiRound = await saveGuess(request, accessToken);
      return roundFromDto(apiRound);
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

/**
 * Mutation hook for revealing funfact
 */
export const useRevealFunfact = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<RoundDto, Error, FortedleServerModelsDTOsRevealFunfactRequest>({
    mutationFn: async (request) => {
      const apiRound = await revealFunfact(request, accessToken);
      return roundFromDto(apiRound);
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

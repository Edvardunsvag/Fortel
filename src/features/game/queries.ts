import { useQuery, useMutation } from "@tanstack/react-query";
import { getCurrentRound, startRound, saveGuess, revealFunfact } from "./api";
import { roundFromDto } from "./fromDto";
import type { RoundDto } from "./fromDto";
import type {
  FortedleServerModelsStartRoundRequest,
  FortedleServerModelsSaveGuessRequest,
  FortedleServerModelsRevealFunfactRequest,
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
  return useQuery<RoundDto | null>({
    queryKey: roundKeys.current(userId, date),
    queryFn: async () => {
      const apiRound = await getCurrentRound(userId, date);
      if (apiRound) {
        return roundFromDto(apiRound);
      }
      return null;
    },
    enabled,
  });
};

/**
 * Mutation hook for starting a round
 */
export const useStartRound = () => {
  return useMutation<RoundDto, Error, FortedleServerModelsStartRoundRequest>({
    mutationFn: async (request) => {
      const apiRound = await startRound(request);
      return roundFromDto(apiRound);
    },
  });
};

/**
 * Mutation hook for saving a guess
 */
export const useSaveGuess = () => {
  return useMutation<RoundDto, Error, FortedleServerModelsSaveGuessRequest>({
    mutationFn: async (request) => {
      const apiRound = await saveGuess(request);
      return roundFromDto(apiRound);
    },
  });
};

/**
 * Mutation hook for revealing funfact
 */
export const useRevealFunfact = () => {
  return useMutation<RoundDto, Error, FortedleServerModelsRevealFunfactRequest>({
    mutationFn: async (request) => {
      const apiRound = await revealFunfact(request);
      return roundFromDto(apiRound);
    },
  });
};

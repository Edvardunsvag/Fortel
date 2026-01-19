import { roundsApi } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsRoundDto,
  FortedleServerModelsDTOsRevealFunfactRequest,
  FortedleServerModelsDTOsSaveGuessRequest,
  FortedleServerModelsDTOsStartRoundRequest,
} from "@/shared/api/generated/index";

export const getCurrentRound = async (userId: string, date?: string): Promise<FortedleServerModelsDTOsRoundDto | null> => {
  try {
    const response = await roundsApi.apiRoundsCurrentGet(userId, date);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get current round: ${axiosError.response?.status}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to get current round");
  }
};

export const startRound = async (
  request: FortedleServerModelsDTOsStartRoundRequest
): Promise<FortedleServerModelsDTOsRoundDto> => {
  try {
    const response = await roundsApi.apiRoundsStartPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { statusText?: string } };
      throw new Error(`Failed to start round: ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to start round");
  }
};

export const saveGuess = async (
  request: FortedleServerModelsDTOsSaveGuessRequest
): Promise<FortedleServerModelsDTOsRoundDto> => {
  try {
    const response = await roundsApi.apiRoundsGuessPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { statusText?: string } };
      throw new Error(`Failed to save guess: ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to save guess");
  }
};

export const revealFunfact = async (
  request: FortedleServerModelsDTOsRevealFunfactRequest
): Promise<FortedleServerModelsDTOsRoundDto> => {
  try {
    const response = await roundsApi.apiRoundsRevealFunfactPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { statusText?: string } };
      throw new Error(`Failed to reveal funfact: ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to reveal funfact");
  }
};

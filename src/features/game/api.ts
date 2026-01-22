import { createApiClients } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsRoundDto,
  FortedleServerModelsDTOsRevealFunfactRequest,
  FortedleServerModelsDTOsSaveGuessRequest,
  FortedleServerModelsDTOsStartRoundRequest,
} from "@/shared/api/generated/index";

export const getCurrentRound = async (
  userId: string,
  date: string | undefined,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsRoundDto | null> => {
  try {
    const { roundsApi } = createApiClients(accessToken);
    const response = await roundsApi.apiRoundsCurrentGet(userId, date);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get current round: ${axiosError.response?.status}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to get current round");
  }
};

export const startRound = async (
  request: FortedleServerModelsDTOsStartRoundRequest,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsRoundDto> => {
  try {
    const { roundsApi } = createApiClients(accessToken);
    const response = await roundsApi.apiRoundsStartPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { statusText?: string; status?: number } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      throw new Error(`Failed to start round: ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to start round");
  }
};

export const saveGuess = async (
  request: FortedleServerModelsDTOsSaveGuessRequest,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsRoundDto> => {
  try {
    const { roundsApi } = createApiClients(accessToken);
    const response = await roundsApi.apiRoundsGuessPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { statusText?: string; status?: number } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      throw new Error(`Failed to save guess: ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to save guess");
  }
};

export const revealFunfact = async (
  request: FortedleServerModelsDTOsRevealFunfactRequest,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsRoundDto> => {
  try {
    const { roundsApi } = createApiClients(accessToken);
    const response = await roundsApi.apiRoundsRevealFunfactPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { statusText?: string; status?: number } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      throw new Error(`Failed to reveal funfact: ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to reveal funfact");
  }
};

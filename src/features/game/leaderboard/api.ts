import { createApiClients } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsLeaderboardDto,
  FortedleServerModelsDTOsSubmitScoreRequest,
} from "@/shared/api/generated/index";

export const fetchLeaderboard = async (
  date: string | undefined,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsLeaderboardDto> => {
  try {
    const { leaderboardApi } = createApiClients(accessToken);
    const response = await leaderboardApi.apiLeaderboardGet(date);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      throw new Error(`Failed to fetch leaderboard: ${axiosError.response?.status} ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch leaderboard");
  }
};

export const submitScore = async (
  request: FortedleServerModelsDTOsSubmitScoreRequest,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsLeaderboardDto> => {
  try {
    const { leaderboardApi } = createApiClients(accessToken);
    await leaderboardApi.apiLeaderboardSubmitScorePost(request);

    // Fetch the updated leaderboard after submission
    const leaderboardResponse = await leaderboardApi.apiLeaderboardGet();
    return leaderboardResponse.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage = axiosError.response?.data?.error || "Failed to submit score";
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to submit score");
  }
};

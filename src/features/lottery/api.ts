import type {
  HarvestUser,
  HarvestTimeEntriesResponse,
  HarvestAccountsResponse,
} from "./types";
import { harvestConfig } from "@/shared/config/harvestConfig";
import { createApiClients } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsSyncLotteryTicketsRequest,
  FortedleServerModelsDTOsSyncLotteryTicketsResponse,
  FortedleServerModelsDTOsSyncHarvestRequest,
  FortedleServerModelsDTOsSyncHarvestResponse,
  FortedleServerModelsDTOsEmployeeWeeksResponse,
  FortedleServerModelsDTOsExchangeTokenRequest,
  FortedleServerModelsDTOsRefreshTokenRequest,
  FortedleServerModelsDTOsLotteryTicketDto,
  FortedleServerModelsDTOsAllWinnersResponse,
  FortedleServerModelsDTOsEmployeeStatisticsResponse,
  FortedleServerModelsDTOsWheelDataResponse,
  FortedleServerModelsDTOsMonthlyWinnersResponse,
  FortedleServerModelsDTOsLotteryConfigDto,
  FortedleServerModelsDTOsWheelSegmentDto,
  FortedleServerModelsDTOsWheelParticipantDto,
  FortedleServerModelsDTOsClaimWeeklyPrizeRequest,
  FortedleServerModelsDTOsSendGiftcardResponse,
} from "@/shared/api/generated/index";

/**
 * Extract account ID from Harvest access token
 * Harvest tokens are in format: {account_id}.at.{token}
 */
const extractAccountIdFromToken = (accessToken: string): string => {
  const parts = accessToken.split(".");
  if (parts.length >= 2 && parts[0]) {
    return parts[0];
  }
  throw new Error("Unable to extract account ID from access token");
};

/**
 * Exchange authorization code for access token via backend
 * The backend securely handles the client secret
 * @param code - Authorization code from Harvest OAuth callback
 * @param state - State parameter for CSRF protection
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const exchangeCodeForToken = async (
  code: string,
  state: string,
  msalAccessToken: string | null
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  account_id: string;
}> => {
  try {
    const request: FortedleServerModelsDTOsExchangeTokenRequest = {
      code,
      state,
    };

    const { harvestOAuthApi } = createApiClients(msalAccessToken);
    const response = await harvestOAuthApi.apiHarvestOauthExchangePost(request);
    const tokenData = response.data;

    // Map backend response to expected format (backend returns snake_case)
    return {
      access_token: tokenData.access_token || "",
      token_type: tokenData.token_type || "",
      expires_in: tokenData.expires_in || 0,
      refresh_token: tokenData.refresh_token || "",
      account_id: tokenData.account_id || extractAccountIdFromToken(tokenData.access_token || ""),
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to exchange code for token: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to exchange code for token");
  }
};

/**
 * Refresh access token using refresh token via backend
 * The backend securely handles the client secret
 * @param refreshToken - Harvest refresh token
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const refreshAccessToken = async (
  refreshToken: string,
  msalAccessToken: string | null
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  account_id: string;
}> => {
  try {
    const request: FortedleServerModelsDTOsRefreshTokenRequest = {
      refresh_token: refreshToken,
    };

    const { harvestOAuthApi } = createApiClients(msalAccessToken);
    const response = await harvestOAuthApi.apiHarvestOauthRefreshPost(request);
    const tokenData = response.data;

    // Map backend response to expected format (backend returns snake_case)
    return {
      access_token: tokenData.access_token || "",
      token_type: tokenData.token_type || "",
      expires_in: tokenData.expires_in || 0,
      refresh_token: tokenData.refresh_token || "",
      account_id: tokenData.account_id || extractAccountIdFromToken(tokenData.access_token || ""),
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to refresh token: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to refresh token");
  }
};

/**
 * Fetches accessible accounts for the authenticated user
 * This endpoint works WITHOUT the Harvest-Account-ID header
 * @see https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/
 */
export const fetchHarvestAccounts = async (accessToken: string): Promise<HarvestAccountsResponse> => {
  const response = await fetch("https://id.getharvest.com/api/v2/accounts", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Fortedle App",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid Harvest credentials. Please re-authenticate.");
    }
    throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetches the current user's information from Harvest API
 * Uses the /v2/users/me endpoint to get the authenticated user's info including user ID
 *
 * IMPORTANT: The accountId parameter is required to get the account-specific user ID.
 * Without it, the endpoint returns the global Harvest ID user ID (not the account-specific one).
 *
 * @param accessToken - OAuth access token
 * @param accountId - Account ID (required to get account-specific user ID)
 * @see https://help.getharvest.com/api-v2/users-api/users/users/
 */
export const fetchHarvestUser = async (accessToken: string, accountId?: string | null): Promise<HarvestUser> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "Fortedle App",
    "Content-Type": "application/json",
  };

  // Include Harvest-Account-ID header to get account-specific user ID
  if (accountId) {
    headers["Harvest-Account-ID"] = accountId;
  }

  const response = await fetch(`${harvestConfig.apiBase}/users/me`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid Harvest credentials. Please re-authenticate.");
    }
    throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetches time entries for a user within a date range
 *
 * According to Harvest API documentation, the time entries endpoint REQUIRES the Harvest-Account-ID header.
 *
 * @param accountId - Account ID (required - the time entries endpoint requires this header)
 * @param accessToken - OAuth access token
 * @param userId - Account-specific user ID (from /users/me with Harvest-Account-ID header)
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @see https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/
 */
export const fetchHarvestTimeEntries = async (
  accountId: string,
  accessToken: string,
  userId: number,
  from: string,
  to: string
): Promise<HarvestTimeEntriesResponse> => {
  if (!accountId) {
    throw new Error("Account ID is required for fetching time entries");
  }

  const url = new URL(`${harvestConfig.apiBase}/time_entries`);
  url.searchParams.append("user_id", userId.toString());
  url.searchParams.append("from", from);
  url.searchParams.append("to", to);

  const headers: Record<string, string> = {
    "Harvest-Account-ID": accountId,
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "Fortedle App",
    "Content-Type": "application/json",
  };

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid Harvest credentials. Please re-authenticate.");
    }
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch time entries: ${response.status} ${errorText}`);
  }

  return response.json();
};

/**
 * Fetches all lottery tickets for a user
 *
 * @param userId - User ID (from Harvest user)
 */
export const fetchLotteryTickets = async (
  userId: string,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsLotteryTicketDto[]> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsGet(userId);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch lottery tickets: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch lottery tickets");
  }
};

/**
 * Syncs lottery tickets for a user
 * Sends eligible weeks to the backend to be stored as lottery tickets
 *
 * @param userId - User ID (from Harvest user)
 * @param name - User name
 * @param image - User image URL (optional)
 * @param eligibleWeeks - Array of eligible week keys (e.g., ["2024-W01", "2024-W02"])
 */
export const syncLotteryTickets = async (
  userId: string,
  name: string,
  image: string | null | undefined,
  eligibleWeeks: string[],
  accessToken: string | null
): Promise<FortedleServerModelsDTOsSyncLotteryTicketsResponse> => {
  try {
    const request: FortedleServerModelsDTOsSyncLotteryTicketsRequest = {
      userId,
      name,
      image: image || null,
      eligibleWeeks,
    };

    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsSyncPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to sync lottery tickets: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to sync lottery tickets");
  }
};

/**
 * Fetches all winners grouped by week
 *
 * @returns All winners grouped by week
 */
export const fetchAllWinners = async (accessToken: string | null): Promise<FortedleServerModelsDTOsAllWinnersResponse> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsWinnersGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch winners: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch winners");
  }
};

/**
 * Fetches employee lottery statistics (tickets count and wins count)
 *
 * @returns Employee statistics with ticket counts and win counts
 */
export const fetchEmployeeStatistics = async (accessToken: string | null): Promise<FortedleServerModelsDTOsEmployeeStatisticsResponse> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsStatisticsGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch employee statistics: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch employee statistics");
  }
};

// ============ Grand Finale Lucky Wheel API Functions ============

// Re-export generated types for convenience
export type WheelSegment = FortedleServerModelsDTOsWheelSegmentDto;
export type WheelParticipant = FortedleServerModelsDTOsWheelParticipantDto;
export type WheelDataResponse = FortedleServerModelsDTOsWheelDataResponse;
export type MonthlyWinnersResponse = FortedleServerModelsDTOsMonthlyWinnersResponse;
export type LotteryConfig = FortedleServerModelsDTOsLotteryConfigDto;

// MonthlyWinner type is exported from lotterySlice to avoid duplicate exports
export type { MonthlyWinner } from "./lotterySlice";

/**
 * Fetches wheel data (segments and participants)
 */
export const fetchWheelData = async (accessToken: string | null): Promise<FortedleServerModelsDTOsWheelDataResponse> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsWheelGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch wheel data: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch wheel data");
  }
};

/**
 * Fetches monthly winners for a specific month
 */
export const fetchMonthlyWinners = async (month: string | undefined, accessToken: string | null): Promise<FortedleServerModelsDTOsMonthlyWinnersResponse> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsMonthlyWinnersGet(month);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch monthly winners: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch monthly winners");
  }
};

/**
 * Fetches the latest monthly winners
 */
export const fetchLatestMonthlyWinners = async (accessToken: string | null): Promise<FortedleServerModelsDTOsMonthlyWinnersResponse> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsMonthlyWinnersLatestGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch latest monthly winners: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch latest monthly winners");
  }
};

/**
 * Fetches lottery configuration
 */
export const fetchLotteryConfig = async (accessToken: string | null): Promise<FortedleServerModelsDTOsLotteryConfigDto> => {
  try {
    const { lotteryTicketsApi } = createApiClients(accessToken);
    const response = await lotteryTicketsApi.apiLotteryTicketsConfigGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch lottery config: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch lottery config");
  }
};

/**
 * Syncs employee weeks from Harvest
 * Sends OAuth tokens to backend, which fetches time entries and calculates weekly summaries
 *
 * @param request - OAuth token data
 */
export const syncFromHarvest = async (
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  accountId: string,
  msalAccessToken: string | null
): Promise<FortedleServerModelsDTOsSyncHarvestResponse> => {
  try {
    const request: FortedleServerModelsDTOsSyncHarvestRequest = {
      accessToken,
      refreshToken,
      expiresAt: new Date(expiresAt).toISOString(),
      accountId,
    };

    const { employeeWeeksApi } = createApiClients(msalAccessToken);
    const response = await employeeWeeksApi.apiEmployeeWeeksSyncPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to sync from Harvest: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to sync from Harvest");
  }
};

/**
 * Fetches all employee weeks for a user
 *
 * @param userId - User ID (from Harvest user)
 * @param accessToken - MSAL access token for backend authentication
 */
export const fetchEmployeeWeeks = async (userId: string, accessToken: string | null): Promise<FortedleServerModelsDTOsEmployeeWeeksResponse> => {
  try {
    const { employeeWeeksApi } = createApiClients(accessToken);
    const response = await employeeWeeksApi.apiEmployeeWeeksGet(userId);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch employee weeks: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch employee weeks");
  }
};

/**
 * Claims weekly prize for a winning ticket
 *
 * @param winningTicketId - ID of the winning ticket
 * @param userId - Harvest user ID
 * @param accessToken - MSAL access token for backend authentication
 */
export const claimWeeklyPrize = async (winningTicketId: number, userId: string, accessToken: string | null): Promise<FortedleServerModelsDTOsSendGiftcardResponse> => {
  try {
    const { giftcardsApi } = createApiClients(accessToken);
    // TODO: After regenerating API client, this type will include userId
    const request = {
      winningTicketId,
      userId,
    } as FortedleServerModelsDTOsClaimWeeklyPrizeRequest & { userId: string };
    const response = await giftcardsApi.apiGiftcardsClaimWeeklyPrizePost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to claim prize: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to claim prize");
  }
};

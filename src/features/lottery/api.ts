import type { HarvestUser, HarvestTimeEntriesResponse, HarvestAccountsResponse } from "./types";
import { createApiClients } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsSyncLotteryTicketsRequest,
  FortedleServerModelsDTOsSyncLotteryTicketsResponse,
  FortedleServerModelsDTOsSyncHarvestResponse,
  FortedleServerModelsDTOsEmployeeWeeksResponse,
  FortedleServerModelsDTOsExchangeTokenRequest,
  FortedleServerModelsDTOsLotteryTicketDto,
  FortedleServerModelsDTOsAllWinnersResponse,
  FortedleServerModelsDTOsEmployeeStatisticsResponse,
  FortedleServerModelsDTOsWheelDataResponse,
  FortedleServerModelsDTOsMonthlyWinnersResponse,
  FortedleServerModelsDTOsLotteryConfigDto,
  FortedleServerModelsDTOsWheelSegmentDto,
  FortedleServerModelsDTOsWheelParticipantDto,
  // TODO: These types are missing from generated API - need to add Swagger attributes to backend endpoints
  // FortedleServerModelsDTOsClaimWeeklyPrizeRequest,
  FortedleServerModelsDTOsSendGiftcardResponse,
  // FortedleServerModelsDTOsHarvestTokenStatusResponse,
  // FortedleServerModelsDTOsHarvestUserResponse,
  // FortedleServerModelsDTOsHarvestTimeEntriesResponse,
} from "@/shared/api/generated/index";

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

    // Backend now stores tokens in database and doesn't return them for security
    // Return success response with account_id only (tokens are managed by backend)
    return {
      access_token: "", // Tokens are now stored on backend, not returned to frontend
      token_type: tokenData.token_type || "",
      expires_in: tokenData.expires_in || 0,
      refresh_token: "", // Tokens are now stored on backend, not returned to frontend
      account_id: tokenData.account_id || "",
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
 * Fetches accessible accounts for the authenticated user
 * This endpoint works WITHOUT the Harvest-Account-ID header
 * @deprecated This function may not be needed anymore - backend handles account retrieval
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
 * Fetches the current user's information from Harvest API via backend
 * Backend retrieves tokens from database automatically
 *
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const fetchHarvestUser = async (_msalAccessToken: string | null): Promise<HarvestUser> => {
  // TODO: Fix Swagger to expose /api/harvest-oauth/user endpoint
  throw new Error("Harvest user endpoint not available in API client - needs Swagger fix");
  /* try {
    const { harvestOAuthApi } = createApiClients(msalAccessToken);
    const response = await harvestOAuthApi.apiHarvestOauthUserGet();
    const data: FortedleServerModelsDTOsHarvestUserResponse = response.data;

    // Map backend response to frontend HarvestUser type
    if (!data.id || !data.first_name || !data.last_name || !data.email) {
      throw new Error("Invalid user data received from backend");
    }

    return {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      timezone: data.timezone ?? "",
      weekly_capacity: data.weekly_capacity ?? 0,
      is_active: data.is_active ?? false,
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch Harvest user: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch Harvest user");
  }
  */
};

/**
 * Fetches time entries for a user within a date range via backend
 * Backend retrieves tokens from database automatically
 *
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const fetchHarvestTimeEntries = async (
  _from: string,
  _to: string,
  _msalAccessToken: string | null
): Promise<HarvestTimeEntriesResponse> => {
  // TODO: Fix Swagger to expose /api/harvest-oauth/time-entries endpoint
  throw new Error("Harvest time entries endpoint not available in API client - needs Swagger fix");
  /* try {
    const { harvestOAuthApi } = createApiClients(msalAccessToken);
    const response = await harvestOAuthApi.apiHarvestOauthTimeEntriesGet(from, to);
    const data: FortedleServerModelsDTOsHarvestTimeEntriesResponse = response.data;

    // Map backend response to frontend HarvestTimeEntriesResponse type
    const timeEntries = (data.time_entries || []).map((te) => ({
      id: te.id ?? 0,
      spent_date: te.spent_date ?? "",
      hours: te.hours ?? 0,
      hours_without_timer: te.hours ?? 0, // Backend doesn't provide this, use hours as fallback
      rounded_hours: te.hours ?? 0, // Backend doesn't provide this, use hours as fallback
      notes: null,
      is_locked: false,
      locked_reason: null,
      approval_status: "pending",
      is_closed: false,
      is_billed: false,
      created_at: te.created_at ?? new Date().toISOString(),
      updated_at: te.updated_at ?? new Date().toISOString(),
      user: {
        id: 0, // Backend doesn't provide user info in time entry
        name: "",
      },
      client: te.client
        ? {
            id: te.client.id ?? 0,
            name: te.client.name ?? "",
            currency: "",
          }
        : null,
      project: null,
      task: null,
    }));

    return {
      time_entries: timeEntries,
      per_page: timeEntries.length,
      total_pages: 1,
      total_entries: timeEntries.length,
      page: 1,
      next_page: null,
      previous_page: null,
      links: {
        first: "",
        next: null,
        previous: null,
        last: "",
      },
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch time entries: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch time entries");
  }
  */
};

/**
 * Fetches all lottery tickets for a user
 *
 * @param userId - User ID (Harvest user ID - numeric)
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
export const fetchAllWinners = async (
  accessToken: string | null
): Promise<FortedleServerModelsDTOsAllWinnersResponse> => {
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
export const fetchEmployeeStatistics = async (
  accessToken: string | null
): Promise<FortedleServerModelsDTOsEmployeeStatisticsResponse> => {
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
export const fetchWheelData = async (
  accessToken: string | null
): Promise<FortedleServerModelsDTOsWheelDataResponse> => {
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
export const fetchMonthlyWinners = async (
  month: string | undefined,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsMonthlyWinnersResponse> => {
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
export const fetchLatestMonthlyWinners = async (
  accessToken: string | null
): Promise<FortedleServerModelsDTOsMonthlyWinnersResponse> => {
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
export const fetchLotteryConfig = async (
  accessToken: string | null
): Promise<FortedleServerModelsDTOsLotteryConfigDto> => {
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
 * Backend retrieves tokens from database automatically
 *
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const syncFromHarvest = async (
  msalAccessToken: string | null
): Promise<FortedleServerModelsDTOsSyncHarvestResponse> => {
  try {
    // The sync endpoint no longer requires a request body - backend gets tokens from database
    const { employeeWeeksApi } = createApiClients(msalAccessToken);
    const response = await employeeWeeksApi.apiEmployeeWeeksSyncPost();
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
 * @param userId - User ID (Harvest user ID - numeric)
 * @param accessToken - MSAL access token for backend authentication
 */
export const fetchEmployeeWeeks = async (
  userId: string,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsEmployeeWeeksResponse> => {
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
export const claimWeeklyPrize = async (
  _winningTicketId: number,
  _userId: string,
  _accessToken: string | null
): Promise<FortedleServerModelsDTOsSendGiftcardResponse> => {
  // TODO: Fix Swagger to expose /api/Giftcards/claim-weekly-prize endpoint
  throw new Error("Claim weekly prize endpoint not available in API client - needs Swagger fix");
  /* try {
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
  */
};

/**
 * Check Harvest token status for the authenticated user
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const checkHarvestTokenStatus = async (
  _msalAccessToken: string | null
): Promise<{ is_authenticated: boolean; account_id: string | null }> => {
  // TODO: Fix Swagger to expose /api/harvest-oauth/status endpoint
  throw new Error("Harvest token status endpoint not available in API client - needs Swagger fix");
  /* try {
    const { harvestOAuthApi } = createApiClients(msalAccessToken);
    const response = await harvestOAuthApi.apiHarvestOauthStatusGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to check token status: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to check token status");
  }
  */
};

/**
 * Revoke Harvest token for the authenticated user
 * @param msalAccessToken - MSAL access token for backend authentication
 */
export const revokeHarvestToken = async (_msalAccessToken: string | null): Promise<void> => {
  // TODO: Fix Swagger to expose /api/harvest-oauth/revoke endpoint
  throw new Error("Harvest revoke endpoint not available in API client - needs Swagger fix");
  /* try {
    const { harvestOAuthApi } = createApiClients(msalAccessToken);
    await harvestOAuthApi.apiHarvestOauthRevokeDelete();
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to revoke token: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to revoke token");
  }
  */
};

import type { HarvestUser, HarvestTimeEntriesResponse, HarvestAccountsResponse } from "./types";
import { harvestConfig } from "@/shared/config/harvestConfig";
import { lotteryTicketsApi } from "@/shared/api/client";
import type {
  FortedleServerModelsSyncLotteryTicketsRequest,
  FortedleServerModelsSyncLotteryTicketsResponse,
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
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (
  code: string
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  account_id: string;
}> => {
  const response = await fetch(harvestConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Fortedle App",
    },
    body: new URLSearchParams({
      client_id: harvestConfig.clientId,
      client_secret: harvestConfig.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: harvestConfig.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${response.status} ${error}`);
  }

  const tokenData = await response.json();

  // Extract account_id from the access token if not provided in response
  if (!tokenData.account_id && tokenData.access_token) {
    tokenData.account_id = extractAccountIdFromToken(tokenData.access_token);
  }

  return tokenData;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  account_id: string;
}> => {
  const response = await fetch(harvestConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Fortedle App",
    },
    body: new URLSearchParams({
      client_id: harvestConfig.clientId,
      client_secret: harvestConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }

  const tokenData = await response.json();

  // Extract account_id from the access token if not provided in response
  if (!tokenData.account_id && tokenData.access_token) {
    tokenData.account_id = extractAccountIdFromToken(tokenData.access_token);
  }

  return tokenData;
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
  userId: string
): Promise<
  Array<{
    id: number;
    userId: string;
    name: string;
    image: string | null;
    eligibleWeek: string;
    isUsed: boolean;
    createdAt: string;
    updatedAt: string;
  }>
> => {
  try {
    // Method will be available after regenerating API client: npm run generate:api
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = lotteryTicketsApi as any;
    const response = await api.apiLotteryTicketsGet(userId);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
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
  eligibleWeeks: string[]
): Promise<FortedleServerModelsSyncLotteryTicketsResponse> => {
  try {
    const request: FortedleServerModelsSyncLotteryTicketsRequest = {
      userId,
      name,
      image: image || null,
      eligibleWeeks,
    };

    const response = await lotteryTicketsApi.apiLotteryTicketsSyncPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
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
export const fetchAllWinners = async (): Promise<{
  weeklyWinners: Array<{
    week: string;
    winners: Array<{
      userId: string;
      name: string;
      image: string | null;
      week: string;
      createdAt: string;
    }>;
  }>;
}> => {
  try {
    // Method will be available after regenerating API client: npm run generate:api
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = lotteryTicketsApi as any;
    const response = await api.apiLotteryTicketsWinnersGet();
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number; statusText?: string } };
      const errorMessage =
        axiosError.response?.data?.error ||
        `Failed to fetch winners: ${axiosError.response?.status} ${axiosError.response?.statusText}`;
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch winners");
  }
};

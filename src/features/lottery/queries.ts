import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/shared/config/msalConfig";
import type { AppDispatch } from "@/app/store";
import {
  fetchHarvestUser,
  fetchHarvestTimeEntries,
  exchangeCodeForToken,
  refreshAccessToken,
  fetchHarvestAccounts,
  syncLotteryTickets,
  fetchLotteryTickets,
  fetchAllWinners,
  fetchEmployeeStatistics,
  fetchWheelData,
  fetchMonthlyWinners,
  fetchLatestMonthlyWinners,
  fetchLotteryConfig,
  syncFromHarvest,
  fetchEmployeeWeeks,
  claimWeeklyPrize,
} from "./api";
import type { WheelDataResponse, MonthlyWinnersResponse, LotteryConfig } from "./api";
import type {
  FortedleServerModelsDTOsSyncHarvestResponse,
  FortedleServerModelsDTOsEmployeeWeeksResponse,
} from "@/shared/api/generated/index";
import type { HarvestUser, HarvestTimeEntry } from "./types";
import {
  selectLotteryToken,
  setTokenFromAuth,
  setTokenFromRefresh,
  setTokenAccountId,
  clearLottery,
  type HarvestToken,
} from "./lotterySlice";

// Query keys
export const lotteryKeys = {
  all: ["lottery"] as const,
  user: () => [...lotteryKeys.all, "user"] as const,
  timeEntries: (from: string, to: string) => [...lotteryKeys.all, "timeEntries", from, to] as const,
  tickets: (userId: string) => [...lotteryKeys.all, "tickets", userId] as const,
  winners: () => [...lotteryKeys.all, "winners"] as const,
  statistics: () => [...lotteryKeys.all, "statistics"] as const,
  employeeWeeks: (userId: string) => [...lotteryKeys.all, "employeeWeeks", userId] as const,
  // Grand Finale Lucky Wheel keys
  wheelData: () => [...lotteryKeys.all, "wheelData"] as const,
  monthlyWinners: (month?: string) => [...lotteryKeys.all, "monthlyWinners", month] as const,
  latestMonthlyWinners: () => [...lotteryKeys.all, "latestMonthlyWinners"] as const,
  lotteryConfig: () => [...lotteryKeys.all, "config"] as const,
};

/**
 * Helper to get a valid token, refreshing if needed
 * @param token - Current Harvest token
 * @param dispatch - Redux dispatch function
 * @param msalAccessToken - MSAL access token for backend authentication
 */
const getValidToken = async (token: HarvestToken | null, dispatch: AppDispatch, msalAccessToken: string | null): Promise<HarvestToken> => {
  if (!token) {
    throw new Error("Not authenticated with Harvest");
  }

  if (!token.accountId) {
    throw new Error("Account ID is missing. Please re-authenticate.");
  }

  // Check if token is expired and refresh if needed
  if (Date.now() >= token.expiresAt - 60000) {
    // Refresh token
    try {
      const tokenResponse = await refreshAccessToken(token.refreshToken, msalAccessToken);
      const newToken: HarvestToken = {
        ...token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || token.refreshToken,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        accountId: tokenResponse.account_id || token.accountId,
      };
      sessionStorage.setItem("harvest_token", JSON.stringify(newToken));
      dispatch(setTokenFromRefresh(newToken));
      return newToken;
    } catch (error) {
      // If refresh fails, clear token and require re-auth
      sessionStorage.removeItem("harvest_token");
      dispatch(clearLottery());
      throw new Error("Token expired. Please re-authenticate.");
    }
  }

  return token;
};

/**
 * Query hook for fetching Harvest user
 */
export const useLotteryUser = (enabled = true) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectLotteryToken);
  const msalAccessToken = useAppSelector(selectAccessToken);

  return useQuery<HarvestUser>({
    queryKey: lotteryKeys.user(),
    queryFn: async () => {
      const validToken = await getValidToken(token, dispatch, msalAccessToken);
      return fetchHarvestUser(validToken.accessToken, validToken.accountId);
    },
    enabled: enabled && token !== null,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching Harvest time entries
 */
export const useLotteryTimeEntries = (from: string, to: string, enabled = true) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectLotteryToken);
  const msalAccessToken = useAppSelector(selectAccessToken);
  const queryClient = useQueryClient();

  return useQuery<HarvestTimeEntry[]>({
    queryKey: lotteryKeys.timeEntries(from, to),
    queryFn: async () => {
      const validToken = await getValidToken(token, dispatch, msalAccessToken);

      // Fetch user info if we don't have it yet (needed for user ID)
      let user: HarvestUser | undefined;
      try {
        const userData = queryClient.getQueryData<HarvestUser>(lotteryKeys.user());
        if (!userData) {
          user = await fetchHarvestUser(validToken.accessToken, validToken.accountId);
          // Cache the user data
          queryClient.setQueryData(lotteryKeys.user(), user);
        } else {
          user = userData;
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch user info");
      }

      const userId = user.id;

      try {
        const response = await fetchHarvestTimeEntries(validToken.accountId, validToken.accessToken, userId, from, to);
        return response.time_entries;
      } catch (error) {
        // If 401, try refreshing token once
        if (error instanceof Error && error.message.includes("401")) {
          // Try to refresh token
          try {
            if (!token) {
              throw new Error("No token to refresh");
            }
            const tokenResponse = await refreshAccessToken(token.refreshToken, msalAccessToken);
            const refreshedToken: HarvestToken = {
              ...token,
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token || token.refreshToken,
              expiresAt: Date.now() + tokenResponse.expires_in * 1000,
              accountId: tokenResponse.account_id || token.accountId,
            };
            sessionStorage.setItem("harvest_token", JSON.stringify(refreshedToken));
            dispatch(setTokenFromRefresh(refreshedToken));

            const retryResponse = await fetchHarvestTimeEntries(
              refreshedToken.accountId,
              refreshedToken.accessToken,
              userId,
              from,
              to
            );
            return retryResponse.time_entries;
          } catch (refreshError) {
            // If refresh fails, throw the original error
            throw error;
          }
        }
        throw error;
      }
    },
    enabled: enabled && token !== null && from !== "" && to !== "",
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

/**
 * Mutation hook for authenticating with OAuth code
 */
export const useAuthenticateLottery = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { instance, accounts } = useMsal();
  const msalAccessTokenFromRedux = useAppSelector(selectAccessToken);

  return useMutation<{ token: HarvestToken }, Error, { code: string; state: string }>({
    mutationFn: async ({ code, state }) => {
      // Verify state (should match what we stored)
      const storedState = sessionStorage.getItem("harvest_oauth_state");
      if (storedState !== state) {
        throw new Error("Invalid state parameter. Possible CSRF attack.");
      }
      sessionStorage.removeItem("harvest_oauth_state");

      // Exchange code for token (state is validated on frontend and backend)
      // Use MSAL token from Redux or acquire dynamically
      const msalToken = msalAccessTokenFromRedux || (accounts.length > 0 ? (await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] })).accessToken : null);
      const tokenResponse = await exchangeCodeForToken(code, state, msalToken);

      // Fetch accounts to get the correct account ID (not from token extraction)
      let accountId = tokenResponse.account_id;
      try {
        const accountsResponse = await fetchHarvestAccounts(tokenResponse.access_token);
        // Use the first Harvest account ID (not Forecast)
        const harvestAccount = accountsResponse.accounts.find((acc) => acc.product === "harvest");
        if (harvestAccount) {
          accountId = harvestAccount.id.toString();
        }
      } catch (error) {
        // If accounts fetch fails, fall back to extracted account_id
      }

      const token: HarvestToken = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        accountId: accountId || tokenResponse.account_id,
      };

      // Store token in sessionStorage for persistence
      sessionStorage.setItem("harvest_token", JSON.stringify(token));

      // Set token in Redux
      dispatch(setTokenFromAuth(token));

      // After OAuth, sync from Harvest to populate employee weeks
      // Dynamically acquire MSAL token when needed (required for backend authentication)
      let msalAccessToken: string | null = null;
      
      // Try to get token dynamically first
      // If accounts aren't available immediately (e.g., after redirect), wait a bit and retry
      if (accounts.length === 0 && msalAccessTokenFromRedux) {
        msalAccessToken = msalAccessTokenFromRedux;
      } else {
        try {
          if (accounts.length > 0) {
            const account = accounts[0];
            const tokenResponse = await instance.acquireTokenSilent({
              ...loginRequest,
              account,
            });
            msalAccessToken = tokenResponse.accessToken;
          } else {
            // Fall back to Redux token if available
            if (msalAccessTokenFromRedux) {
              msalAccessToken = msalAccessTokenFromRedux;
            }
          }
        } catch (tokenError) {
          // Fall back to Redux token if available
          if (msalAccessTokenFromRedux) {
            msalAccessToken = msalAccessTokenFromRedux;
          }
        }
      }

      try {
        await syncFromHarvest(token.accessToken, token.refreshToken, token.expiresAt, token.accountId, msalAccessToken);
      } catch (syncError) {
        // Sync failed but don't fail the authentication
      }

      return { token };
    },
    onSuccess: () => {
      // Invalidate all lottery queries to refetch after authentication
      // This ensures time entries and other data are refreshed immediately
      queryClient.invalidateQueries({ queryKey: lotteryKeys.all });
    },
  });
};

/**
 * Mutation hook for refreshing Harvest token
 * Note: This is typically called automatically by getValidToken, but can be used manually
 */
export const useRefreshLotteryToken = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const token = useAppSelector(selectLotteryToken);
  const msalAccessToken = useAppSelector(selectAccessToken);

  return useMutation<HarvestToken, Error, void>({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No token to refresh");
      }

      const tokenResponse = await refreshAccessToken(token.refreshToken, msalAccessToken);

      const newToken: HarvestToken = {
        ...token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || token.refreshToken,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        accountId: tokenResponse.account_id || token.accountId,
      };

      sessionStorage.setItem("harvest_token", JSON.stringify(newToken));

      // Update Redux state
      dispatch(setTokenFromRefresh(newToken));

      return newToken;
    },
    onSuccess: () => {
      // Invalidate queries that depend on token
      queryClient.invalidateQueries({ queryKey: lotteryKeys.all });
    },
  });
};

/**
 * Mutation hook for testing Harvest API calls
 */
export const useTestLotteryApi = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectLotteryToken);
  const queryClient = useQueryClient();

  return useMutation<{ user: HarvestUser; accounts: any; updatedAccountId?: string }, Error, void>({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No token available");
      }

      // Check if token is expired
      if (Date.now() >= token.expiresAt - 60000) {
        throw new Error("Token expired. Please re-authenticate.");
      }

      // Fetch accounts first to get the correct account ID
      const accounts = await fetchHarvestAccounts(token.accessToken);

      // Use the first Harvest account ID (not Forecast)
      const harvestAccount = accounts.accounts.find((acc) => acc.product === "harvest");
      const correctAccountId = harvestAccount ? harvestAccount.id.toString() : token.accountId;

      // Fetch user with the correct account ID
      const user = await fetchHarvestUser(token.accessToken, correctAccountId);

      // Update token with correct account ID if it's different
      if (correctAccountId !== token.accountId) {
        const updatedToken = { ...token, accountId: correctAccountId };
        sessionStorage.setItem("harvest_token", JSON.stringify(updatedToken));
        // Update Redux state
        dispatch(setTokenAccountId(correctAccountId));
        return { user, accounts, updatedAccountId: correctAccountId };
      }

      return { user, accounts };
    },
    onSuccess: (data) => {
      // Cache user data
      queryClient.setQueryData(lotteryKeys.user(), data.user);
    },
  });
};

/**
 * Query hook for fetching lottery tickets for a user
 */
export const useLotteryTickets = (userId: string | null, enabled = true) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery({
    queryKey: lotteryKeys.tickets(userId || ""),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return fetchLotteryTickets(userId, accessToken);
    },
    enabled: enabled && userId !== null && userId !== "" && !!accessToken,
    retry: (failureCount, error) => {
      // Don't retry on 400/404 errors (invalid userId) or 401 (auth issues)
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for syncing lottery tickets
 */
export const useSyncLotteryTickets = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<
    { syncedCount: number; skippedCount: number; totalCount: number },
    Error,
    { userId: string; name: string; image: string | null | undefined; eligibleWeeks: string[] }
  >({
    mutationFn: async ({ userId, name, image, eligibleWeeks }) => {
      const response = await syncLotteryTickets(userId, name, image, eligibleWeeks, accessToken);
      // Map the response to ensure all properties are defined (generated types have optional properties)
      return {
        syncedCount: response.syncedCount ?? 0,
        skippedCount: response.skippedCount ?? 0,
        totalCount: response.totalCount ?? 0,
      };
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
 * Query hook for fetching all winners grouped by week
 */
export const useAllWinners = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery({
    queryKey: lotteryKeys.winners(),
    queryFn: async () => {
      return fetchAllWinners(accessToken);
    },
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      // Don't retry on 400/404 errors or 401 (auth issues)
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching employee lottery statistics
 */
export const useEmployeeStatistics = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery({
    queryKey: lotteryKeys.statistics(),
    queryFn: async () => {
      return fetchEmployeeStatistics(accessToken);
    },
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      // Don't retry on 400/404 errors or 401 (auth issues)
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// ============ Grand Finale Lucky Wheel Query Hooks ============

/**
 * Query hook for fetching wheel data (segments and participants)
 */
export const useWheelData = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<WheelDataResponse>({
    queryKey: lotteryKeys.wheelData(),
    queryFn: () => fetchWheelData(accessToken),
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching monthly winners for a specific month
 */
export const useMonthlyWinners = (month?: string) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<MonthlyWinnersResponse>({
    queryKey: lotteryKeys.monthlyWinners(month),
    queryFn: () => fetchMonthlyWinners(month, accessToken),
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching the latest monthly winners
 */
export const useLatestMonthlyWinners = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<MonthlyWinnersResponse>({
    queryKey: lotteryKeys.latestMonthlyWinners(),
    queryFn: () => fetchLatestMonthlyWinners(accessToken),
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Query hook for fetching lottery configuration
 */
export const useLotteryConfig = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<LotteryConfig>({
    queryKey: lotteryKeys.lotteryConfig(),
    queryFn: () => fetchLotteryConfig(accessToken),
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for syncing from Harvest
 * Sends OAuth tokens to backend, which fetches time entries and calculates weekly summaries
 */
export const useSyncFromHarvest = () => {
  const queryClient = useQueryClient();
  const msalAccessToken = useAppSelector(selectAccessToken);

  return useMutation<
    FortedleServerModelsDTOsSyncHarvestResponse,
    Error,
    { accessToken: string; refreshToken: string; expiresAt: number; accountId: string }
  >({
    mutationFn: async ({ accessToken, refreshToken, expiresAt, accountId }) => {
      return syncFromHarvest(accessToken, refreshToken, expiresAt, accountId, msalAccessToken);
    },
    onSuccess: (data) => {
      // Invalidate employee weeks query for this user
      if (data.userId) {
        queryClient.invalidateQueries({ queryKey: lotteryKeys.employeeWeeks(data.userId) });
        // Also invalidate lottery tickets as they are synced
        queryClient.invalidateQueries({ queryKey: lotteryKeys.tickets(data.userId) });
      }
      // Also invalidate all lottery queries to refresh other data
      queryClient.invalidateQueries({ queryKey: lotteryKeys.all });
    },
  });
};

/**
 * Query hook for fetching employee weeks
 */
export const useEmployeeWeeks = (userId: string | null, enabled = true) => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<FortedleServerModelsDTOsEmployeeWeeksResponse>({
    queryKey: lotteryKeys.employeeWeeks(userId || ""),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return fetchEmployeeWeeks(userId, accessToken);
    },
    enabled: enabled && userId !== null && userId !== "" && !!accessToken,
    retry: (failureCount, error) => {
      // Don't retry on 400/404 errors (invalid userId) or 401 (auth issues)
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for claiming weekly prize
 */
export const useClaimWeeklyPrize = () => {
  const queryClient = useQueryClient();
  const accessToken = useAppSelector(selectAccessToken);
  const { data: user } = useLotteryUser(true);
  const userId = user?.id.toString() || null;

  return useMutation<
    import("@/shared/api/generated/index").FortedleServerModelsDTOsSendGiftcardResponse,
    Error,
    { winningTicketId: number }
  >({
    mutationFn: async ({ winningTicketId }) => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return claimWeeklyPrize(winningTicketId, userId, accessToken);
    },
    onSuccess: () => {
      // Invalidate employee weeks query to refresh prize claim status
      if (userId) {
        queryClient.invalidateQueries({ queryKey: lotteryKeys.employeeWeeks(userId) });
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 400/401 errors (validation/auth issues)
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("401") || error.message.includes("Unauthorized"))) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

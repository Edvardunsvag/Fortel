import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import type { AppDispatch } from "@/app/store";
import {
  fetchHarvestUser,
  fetchHarvestTimeEntries,
  exchangeCodeForToken,
  refreshAccessToken,
  fetchHarvestAccounts,
  syncLotteryTickets,
  fetchLotteryTickets,
} from "./api";
import type { HarvestUser, HarvestTimeEntry } from "./types";
import {
  selectLotteryToken,
  setTokenFromAuth,
  setTokenFromRefresh,
  setTokenAccountId,
  clearLottery,
  type HarvestToken,
} from "./lotterySlice";

// Query keys//
export const lotteryKeys = {
  all: ["lottery"] as const,
  user: () => [...lotteryKeys.all, "user"] as const,
  timeEntries: (from: string, to: string) => [...lotteryKeys.all, "timeEntries", from, to] as const,
  tickets: (userId: string) => [...lotteryKeys.all, "tickets", userId] as const,
};

/**
 * Helper to get a valid token, refreshing if needed
 */
const getValidToken = async (token: HarvestToken | null, dispatch: AppDispatch): Promise<HarvestToken> => {
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
      const tokenResponse = await refreshAccessToken(token.refreshToken);
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

  return useQuery<HarvestUser>({
    queryKey: lotteryKeys.user(),
    queryFn: async () => {
      const validToken = await getValidToken(token, dispatch);
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
  const queryClient = useQueryClient();

  return useQuery<HarvestTimeEntry[]>({
    queryKey: lotteryKeys.timeEntries(from, to),
    queryFn: async () => {
      const validToken = await getValidToken(token, dispatch);

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
            const tokenResponse = await refreshAccessToken(token.refreshToken);
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

  return useMutation<{ token: HarvestToken }, Error, { code: string; state: string }>({
    mutationFn: async ({ code, state }) => {
      // Verify state (should match what we stored)
      const storedState = sessionStorage.getItem("harvest_oauth_state");
      if (storedState !== state) {
        throw new Error("Invalid state parameter. Possible CSRF attack.");
      }
      sessionStorage.removeItem("harvest_oauth_state");

      // Exchange code for token
      const tokenResponse = await exchangeCodeForToken(code);

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
        console.warn("Failed to fetch accounts, using extracted account ID:", error);
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

      return { token };
    },
    onSuccess: () => {
      // Invalidate user query to refetch after authentication
      queryClient.invalidateQueries({ queryKey: lotteryKeys.user() });
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

  return useMutation<HarvestToken, Error, void>({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No token to refresh");
      }

      const tokenResponse = await refreshAccessToken(token.refreshToken);

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
      // Log accounts to console for debugging
      console.log("Harvest Accounts:", data.accounts);
      console.log("Using Account ID:", data.updatedAccountId || token?.accountId);
    },
  });
};

/**
 * Query hook for fetching lottery tickets for a user
 */
export const useLotteryTickets = (userId: string | null, enabled = true) => {
  return useQuery({
    queryKey: lotteryKeys.tickets(userId || ""),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return fetchLotteryTickets(userId);
    },
    enabled: enabled && userId !== null && userId !== "",
    retry: (failureCount, error) => {
      // Don't retry on 400/404 errors (invalid userId)
      if (error instanceof Error && (error.message.includes("400") || error.message.includes("404"))) {
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
  return useMutation<
    { syncedCount: number; skippedCount: number; totalCount: number },
    Error,
    { userId: string; name: string; image: string | null | undefined; eligibleWeeks: string[] }
  >({
    mutationFn: async ({ userId, name, image, eligibleWeeks }) => {
      const response = await syncLotteryTickets(userId, name, image, eligibleWeeks);
      // Map the response to ensure all properties are defined (generated types have optional properties)
      return {
        syncedCount: response.syncedCount ?? 0,
        skippedCount: response.skippedCount ?? 0,
        totalCount: response.totalCount ?? 0,
      };
    },
  });
};

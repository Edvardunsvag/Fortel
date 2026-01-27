import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/shared/config/msalConfig";
import {
  fetchHarvestUser,
  fetchHarvestTimeEntries,
  exchangeCodeForToken,
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
  checkHarvestTokenStatus,
} from "./api";
import type { WheelDataResponse, MonthlyWinnersResponse, LotteryConfig } from "./api";
import type {
  FortedleServerModelsDTOsSyncHarvestResponse,
  FortedleServerModelsDTOsEmployeeWeeksResponse,
} from "@/shared/api/generated/index";
import type { HarvestUser, HarvestTimeEntry } from "./types";

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

// Token management is now handled by the backend
// No need for getValidToken - backend automatically refreshes expired tokens

/**
 * Query hook for fetching Harvest user
 */
export const useLotteryUser = (enabled = true) => {
  const msalAccessToken = useAppSelector(selectAccessToken);
  const { instance, accounts } = useMsal();
  const { data: harvestStatus } = useHarvestTokenStatus();

  return useQuery<HarvestUser>({
    queryKey: lotteryKeys.user(),
    queryFn: async () => {
      // Get MSAL token
      let token = msalAccessToken;
      if (!token && accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
          token = response.accessToken;
        } catch (error) {
          throw new Error("Failed to acquire MSAL token");
        }
      }

      if (!token) {
        throw new Error("Not authenticated with Azure AD");
      }

      return fetchHarvestUser(token);
    },
    enabled: enabled && (harvestStatus?.is_authenticated ?? false) && !!msalAccessToken,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if ((error instanceof Error && error.message.includes("401")) || error.message.includes("Unauthorized")) {
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
  const msalAccessToken = useAppSelector(selectAccessToken);
  const { instance, accounts } = useMsal();
  const { data: harvestStatus } = useHarvestTokenStatus();

  return useQuery<HarvestTimeEntry[]>({
    queryKey: lotteryKeys.timeEntries(from, to),
    queryFn: async () => {
      // Get MSAL token
      let token = msalAccessToken;
      if (!token && accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
          token = response.accessToken;
        } catch (error) {
          throw new Error("Failed to acquire MSAL token");
        }
      }

      if (!token) {
        throw new Error("Not authenticated with Azure AD");
      }

      // Backend handles token retrieval and user ID internally
      const response = await fetchHarvestTimeEntries(from, to, token);
      return response.time_entries;
    },
    enabled: enabled && (harvestStatus?.is_authenticated ?? false) && from !== "" && to !== "" && !!msalAccessToken,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if (error instanceof Error && (error.message.includes("401") || error.message.includes("Unauthorized"))) {
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
  const queryClient = useQueryClient();
  const { instance, accounts } = useMsal();
  const msalAccessTokenFromRedux = useAppSelector(selectAccessToken);

  return useMutation<{ success: boolean }, Error, { code: string; state: string }>({
    mutationFn: async ({ code, state }) => {
      // Verify state (should match what we stored)
      const storedState = localStorage.getItem("harvest_oauth_state");
      if (storedState !== state) {
        throw new Error("Invalid state parameter. Possible CSRF attack.");
      }
      localStorage.removeItem("harvest_oauth_state");

      // Exchange code for token - backend stores tokens in database
      // Use MSAL token from Redux or acquire dynamically
      const msalToken =
        msalAccessTokenFromRedux ||
        (accounts.length > 0
          ? (await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] })).accessToken
          : null);
      await exchangeCodeForToken(code, state, msalToken);

      // After OAuth, sync from Harvest to populate employee weeks
      // Backend will retrieve tokens from database automatically
      let msalAccessToken: string | null = null;

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
          } else if (msalAccessTokenFromRedux) {
            msalAccessToken = msalAccessTokenFromRedux;
          }
        } catch (tokenError) {
          if (msalAccessTokenFromRedux) {
            msalAccessToken = msalAccessTokenFromRedux;
          }
        }
      }

      try {
        // syncFromHarvest now works through backend which retrieves tokens from database
        await syncFromHarvest(msalAccessToken);
      } catch (syncError) {
        // Sync failed but don't fail the authentication
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate all lottery queries to refetch after authentication
      // This ensures time entries and other data are refreshed immediately
      queryClient.invalidateQueries({ queryKey: lotteryKeys.all });
    },
  });
};

// Token refresh and testing are now handled by backend automatically
// These hooks are no longer needed

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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for syncing from Harvest
 * Backend retrieves tokens from database automatically
 */
export const useSyncFromHarvest = () => {
  const queryClient = useQueryClient();
  const msalAccessToken = useAppSelector(selectAccessToken);
  const { instance, accounts } = useMsal();

  return useMutation<FortedleServerModelsDTOsSyncHarvestResponse, Error, void>({
    mutationFn: async () => {
      // Get MSAL token
      let token = msalAccessToken;
      if (!token && accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
          token = response.accessToken;
        } catch (error) {
          throw new Error("Failed to acquire MSAL token");
        }
      }

      if (!token) {
        throw new Error("Not authenticated with Azure AD");
      }

      return syncFromHarvest(token);
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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("404") || error.message.includes("Unauthorized"))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for claiming weekly prize
 */
/**
 * Query hook for checking Harvest token status
 */
export const useHarvestTokenStatus = (enabled = true) => {
  const msalAccessToken = useAppSelector(selectAccessToken);
  const { instance, accounts } = useMsal();

  return useQuery({
    queryKey: [...lotteryKeys.all, "harvestStatus"],
    queryFn: async () => {
      // Get MSAL token
      let token = msalAccessToken;
      if (!token && accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
          token = response.accessToken;
        } catch (error) {
          throw new Error("Failed to acquire MSAL token");
        }
      }

      if (!token) {
        throw new Error("Not authenticated with Azure AD");
      }

      return await checkHarvestTokenStatus(token);
    },
    enabled: enabled && !!msalAccessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

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
      if (
        error instanceof Error &&
        (error.message.includes("400") || error.message.includes("401") || error.message.includes("Unauthorized"))
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

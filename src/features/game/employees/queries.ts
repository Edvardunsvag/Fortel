import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { selectAccessToken } from "@/features/auth/authSlice";
import { fetchEmployees, syncEmployees } from "./api";
import { employeeFromDto, syncResultFromDto } from "./fromDto";
import type { Employee } from "./types";
import type { SyncResult } from "./fromDto";
import type { FortedleServerModelsDTOsSyncRequest } from "@/shared/api/generated/index";

// Query keys
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
};

/**
 * Query hook for fetching employees
 */
export const useEmployees = () => {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery<Employee[]>({
    queryKey: employeeKeys.lists(),
    queryFn: async () => {
      const apiEmployees = await fetchEmployees(accessToken);
      return apiEmployees.map(employeeFromDto);
    },
    enabled: !!accessToken, // Only fetch if we have a token
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (auth issues)
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Mutation hook for syncing employees
 */
export const useSyncEmployees = () => {
  const queryClient = useQueryClient();
  const accessToken = useAppSelector(selectAccessToken);

  return useMutation<SyncResult, Error, FortedleServerModelsDTOsSyncRequest>({
    mutationFn: async (request) => {
      const apiResult = await syncEmployees(request, accessToken);
      return syncResultFromDto(apiResult);
    },
    onSuccess: () => {
      // Invalidate and refetch employees after successful sync
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useQuery<Employee[]>({
    queryKey: employeeKeys.lists(),
    queryFn: async () => {
      const apiEmployees = await fetchEmployees();
      return apiEmployees.map(employeeFromDto);
    },
  });
};

/**
 * Mutation hook for syncing employees
 */
export const useSyncEmployees = () => {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, FortedleServerModelsDTOsSyncRequest>({
    mutationFn: async (request) => {
      const apiResult = await syncEmployees(request);
      return syncResultFromDto(apiResult);
    },
    onSuccess: () => {
      // Invalidate and refetch employees after successful sync
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
};

import { createApiClients } from "@/shared/api/client";
import type {
  FortedleServerModelsDTOsEmployeeDto,
  FortedleServerModelsDTOsSyncRequest,
  FortedleServerModelsDTOsSyncResponse,
} from "@/shared/api/generated/index";

export const fetchEmployees = async (accessToken: string | null): Promise<FortedleServerModelsDTOsEmployeeDto[]> => {
  try {
    const { employeesApi } = createApiClients(accessToken);
    const response = await employeesApi.apiEmployeesGet();
    console.log(`Successfully loaded ${response.data.length} employees from database`);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      if (axiosError.response?.status === 404 || axiosError.response?.status === 500) {
        throw new Error("No employee data available. Please sync data first.");
      }
      throw new Error(`Failed to fetch employees: ${axiosError.response?.status} ${axiosError.response?.statusText}`);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to fetch employees from API");
  }
};

export const syncEmployees = async (
  request: FortedleServerModelsDTOsSyncRequest,
  accessToken: string | null
): Promise<FortedleServerModelsDTOsSyncResponse> => {
  try {
    const { syncApi } = createApiClients(accessToken);
    const response = await syncApi.apiSyncPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      if (axiosError.response?.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }
      const errorMessage = axiosError.response?.data?.error || "Failed to sync data";
      throw new Error(errorMessage);
    }
    throw new Error(error instanceof Error ? error.message : "Failed to sync employees");
  }
};

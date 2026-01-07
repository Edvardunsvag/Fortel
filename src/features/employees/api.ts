import { employeesApi, syncApi } from '@/shared/api/client';
import type {
  FortedleServerModelsEmployeeDto,
  FortedleServerModelsSyncRequest,
  FortedleServerModelsSyncResponse,
} from '@/shared/api/generated/index';

export const fetchEmployees = async (): Promise<FortedleServerModelsEmployeeDto[]> => {
  try {
    const response = await employeesApi.apiEmployeesGet();
    console.log(`Successfully loaded ${response.data.length} employees from database`);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string } };
      if (axiosError.response?.status === 404 || axiosError.response?.status === 500) {
        throw new Error('No employee data available. Please sync data first.');
      }
      throw new Error(
        `Failed to fetch employees: ${axiosError.response?.status} ${axiosError.response?.statusText}`
      );
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch employees from API'
    );
  }
};

export const syncEmployees = async (
  request: FortedleServerModelsSyncRequest
): Promise<FortedleServerModelsSyncResponse> => {
  try {
    const response = await syncApi.apiSyncPost(request);
    return response.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError.response?.data?.error || 'Failed to sync data';
      throw new Error(errorMessage);
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to sync employees'
    );
  }
};


import type { Employee } from './types';
import { employeesApi, syncApi } from '@/shared/api/client';
import type { FortedleServerModelsEmployeeDto, FortedleServerModelsSyncRequest } from '@/shared/api/generated';

/**
 * Maps the generated API DTO to the application Employee type
 */
const mapEmployeeDto = (dto: FortedleServerModelsEmployeeDto): Employee => {
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    firstName: dto.firstName ?? '',
    surname: dto.surname ?? '',
    avatarImageUrl: dto.avatarImageUrl ?? undefined,
    department: dto.department ?? '',
    office: dto.office ?? '',
    teams: dto.teams ?? [],
    age: dto.age ?? '-',
    supervisor: dto.supervisor ?? undefined,
    funfact: dto.funfact ?? null,
    interests: dto.interests ?? [],
  };
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await employeesApi.apiEmployeesGet();
    const employeeDtos = response.data;
    
    const employees = employeeDtos.map(mapEmployeeDto);
    console.log(`Successfully loaded ${employees.length} employees from database`);
    return employees;
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

export interface SyncResult {
  success: boolean;
  message: string;
  count: number;
  alreadySynced?: boolean;
}

export const syncEmployees = async (accessToken: string): Promise<SyncResult> => {
  try {
    const request: FortedleServerModelsSyncRequest = {
      accessToken: accessToken.trim(),
    };
    
    const response = await syncApi.apiSyncPost(request);
    const result = response.data;
    
    return {
      success: result.success ?? false,
      message: result.message ?? '',
      count: result.count ?? 0,
    };
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


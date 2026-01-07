import type { FortedleServerModelsEmployeeDto, FortedleServerModelsSyncResponse } from '@/shared/api/generated/index';
import type { Employee } from './types';

export interface SyncResult {
  success: boolean;
  message: string;
  count: number;
  alreadySynced?: boolean;
}

/**
 * Maps the generated EmployeeDto to the application Employee type
 */
export const employeeFromDto = (dto: FortedleServerModelsEmployeeDto): Employee => {
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

/**
 * Maps the generated SyncResponse to the application SyncResult type
 */
export const syncResultFromDto = (dto: FortedleServerModelsSyncResponse): SyncResult => {
  return {
    success: dto.success ?? false,
    message: dto.message ?? '',
    count: dto.count ?? 0,
  };
};


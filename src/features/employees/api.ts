import type { Employee } from './types';

export const fetchEmployees = async (): Promise<Employee[]> => {
  // Fetch from backend API (PostgreSQL)
  try {
    const response = await fetch('/api/employees', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 500) {
        throw new Error('No employee data available. Please sync data first.');
      }
      throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
    }

    const employees: Employee[] = await response.json();
    console.log(`Successfully loaded ${employees.length} employees from database`);
    return employees;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch employees from API'
    );
  }
};

export interface SyncResult {
  success: boolean;
  message: string;
  count: number;
}

export const syncEmployees = async (accessToken: string): Promise<SyncResult> => {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: accessToken.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync data');
    }

    const result: SyncResult = await response.json();
    return result;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to sync employees'
    );
  }
};


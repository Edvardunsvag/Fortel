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


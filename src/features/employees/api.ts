import type { Employee } from './types';
import { mockEmployees } from './mockData';

const isDevelopment = import.meta.env.DEV;

// In development, default to using mock data unless VITE_USE_API=true
// This ensures the app works immediately without needing a backend
const USE_API = isDevelopment ? import.meta.env.VITE_USE_API === 'true' : true;

export const fetchEmployees = async (): Promise<Employee[]> => {
  // In development, use mock data by default (unless explicitly enabled)
  if (isDevelopment && !USE_API) {
    console.log('Using mock employee data (set VITE_USE_API=true to use real API)');
    // Simulate a small delay to mimic API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockEmployees;
  }

  // Try the real API (development with VITE_USE_API=true, or production)
  try {
    const response = await fetch('/api/employees', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      // Response exists but is not ok (404, 500, etc.)
      if (isDevelopment) {
        console.warn(`API returned ${response.status}, falling back to mock data`);
        return mockEmployees;
      }
      throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Network error, CORS issue, or other fetch failure
    if (isDevelopment) {
      console.warn('API request failed, falling back to mock data:', error);
      return mockEmployees;
    }
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch employees'
    );
  }
};


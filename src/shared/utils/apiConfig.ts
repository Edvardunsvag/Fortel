/**
 * API Configuration
 * 
 * In development, uses the Vite proxy (relative URLs).
 * In production, uses the environment variable or defaults to the deployed backend URL.
 */
export const getApiBaseUrl = (): string => {
  // In development, Vite proxy handles /api routes
  // In production, use environment variable or default to deployed backend
  if (import.meta.env.DEV) {
    return ''; // Use relative URLs, Vite proxy will handle it
  }
  
  // In production, use VITE_API_URL if set, otherwise default to deployed backend
  return import.meta.env.VITE_API_URL || 'https://fortedle-backend.azurewebsites.net';
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};


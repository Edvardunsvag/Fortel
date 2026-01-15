/**
 * API Client Configuration
 *
 * Creates configured instances of the generated API clients
 * using the existing apiConfig for base URL management.
 */
import { Configuration, EmployeesApi, LeaderboardApi, RoundsApi, SyncApi, LotteryTicketsApi } from "./generated/index";

const getApiBaseUrl = (): string => {
  // In development, Vite proxy handles /api routes
  // In production, use environment variable or default to deployed backend
  if (import.meta.env.DEV) {
    return ""; // Use relative URLs, Vite proxy will handle it
  }

  // In production, use VITE_API_URL if set, otherwise default to deployed backend
  return import.meta.env.VITE_API_URL || "https://fortedle-backend.azurewebsites.net";
};

/**
 * Creates a Configuration instance for the generated API clients
 */
const createApiConfiguration = (): Configuration => {
  const baseUrl = getApiBaseUrl();

  return new Configuration({
    basePath: baseUrl || undefined,
    baseOptions: {
      headers: {
        "Content-Type": "application/json",
      },
    },
  });
};

/**
 * Configured API client instances
 */
const apiConfig = createApiConfiguration();

export const employeesApi = new EmployeesApi(apiConfig);
export const leaderboardApi = new LeaderboardApi(apiConfig);
export const roundsApi = new RoundsApi(apiConfig);
export const syncApi = new SyncApi(apiConfig);
export const lotteryTicketsApi = new LotteryTicketsApi(apiConfig);

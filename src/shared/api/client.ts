/**
 * API Client Configuration
 *
 * Creates configured instances of the generated API clients
 * with support for JWT Bearer token authentication.
 */
import {
  Configuration,
  EmployeesApi,
  LeaderboardApi,
  RoundsApi,
  SyncApi,
  LotteryTicketsApi,
  EmployeeWeeksApi,
  GiftcardsApi,
  HarvestOAuthApi,
} from "./generated/index";

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
 * @param accessToken - Optional JWT Bearer token for authentication
 */
const createApiConfiguration = (accessToken?: string | null): Configuration => {
  const baseUrl = getApiBaseUrl();

  return new Configuration({
    basePath: baseUrl || undefined,
    // The generated API uses setApiKeyToObject which expects apiKey, not accessToken
    // Since setApiKeyToObject sets the header value directly, we need to include "Bearer " prefix
    apiKey: accessToken ? `Bearer ${accessToken}` : undefined,
    accessToken: accessToken || undefined, // Keep this too in case it's used elsewhere
    baseOptions: {
      headers: {
        "Content-Type": "application/json",
      },
    },
  });
};

/**
 * Factory function to create API client instances with authentication token
 * @param accessToken - JWT Bearer token for authentication (from Redux store)
 */
export const createApiClients = (accessToken: string | null) => {
  const apiConfig = createApiConfiguration(accessToken);

  return {
    employeesApi: new EmployeesApi(apiConfig),
    leaderboardApi: new LeaderboardApi(apiConfig),
    roundsApi: new RoundsApi(apiConfig),
    syncApi: new SyncApi(apiConfig),
    lotteryTicketsApi: new LotteryTicketsApi(apiConfig),
    employeeWeeksApi: new EmployeeWeeksApi(apiConfig),
    giftcardsApi: new GiftcardsApi(apiConfig),
    harvestOAuthApi: new HarvestOAuthApi(apiConfig),
  };
};

/**
 * Default API client instances (without authentication)
 * These should only be used for public endpoints like HealthController
 * For authenticated endpoints, use createApiClients() with a token
 */
const defaultApiConfig = createApiConfiguration();

export const employeesApi = new EmployeesApi(defaultApiConfig);
export const leaderboardApi = new LeaderboardApi(defaultApiConfig);
export const roundsApi = new RoundsApi(defaultApiConfig);
export const syncApi = new SyncApi(defaultApiConfig);
export const lotteryTicketsApi = new LotteryTicketsApi(defaultApiConfig);
export const employeeWeeksApi = new EmployeeWeeksApi(defaultApiConfig);
export const giftcardsApi = new GiftcardsApi(defaultApiConfig);
export const harvestOAuthApi = new HarvestOAuthApi(defaultApiConfig);

/**
 * API Client Configuration
 * 
 * Creates configured instances of the generated API clients
 * using the existing apiConfig for base URL management.
 */
import { Configuration } from './generated/configuration';
import { EmployeesApi, LeaderboardApi, RoundsApi, SyncApi } from './generated/api';
import { getApiBaseUrl } from '@/shared/utils/apiConfig';

/**
 * Creates a Configuration instance for the generated API clients
 */
const createApiConfiguration = (): Configuration => {
  const baseUrl = getApiBaseUrl();
  
  return new Configuration({
    basePath: baseUrl || undefined,
    baseOptions: {
      headers: {
        'Content-Type': 'application/json',
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


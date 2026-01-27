/**
 * Harvest OAuth 2.0 Configuration
 *
 * OAuth credentials from Harvest application settings
 *
 * IMPORTANT: The redirect_uri must match exactly what's configured in your Harvest application.
 * - Development: http://localhost:5173/time-lottery
 * - Production: https://fortedle.hackathon.forteapps.net/time-lottery
 *
 * Required environment variables:
 * - VITE_HARVEST_CLIENT_ID (required)
 * - VITE_HARVEST_REDIRECT_URI (optional, defaults based on environment)
 *
 * Note: Client secret is stored securely on the backend and never exposed to the frontend.
 */
const getRedirectUri = (): string => {
  // Allow override via environment variable
  if (import.meta.env.VITE_HARVEST_REDIRECT_URI) {
    return import.meta.env.VITE_HARVEST_REDIRECT_URI;
  }

  // In development, use localhost with /time-lottery path (matches Harvest app settings)
  if (import.meta.env.DEV) {
    return "http://localhost:5173/time-lottery";
  }

  // In production, use the production URL with /time-lottery path
  return "https://fortedle.hackathon.forteapps.net/time-lottery";
};

const clientId = import.meta.env.VITE_HARVEST_CLIENT_ID;

export const harvestConfig = {
  clientId: clientId || "",
  redirectUri: getRedirectUri(),
  authorizationEndpoint: "https://id.getharvest.com/oauth2/authorize",
  apiBase: "https://api.harvestapp.com/v2",
};

/**
 * Generate a random state string for OAuth security
 */
export const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Get the OAuth authorization URL
 * 
 * Note: Harvest may not support standard OAuth scope parameters.
 * If the scope parameter causes issues, remove it and verify app permissions
 * in the Harvest OAuth app settings dashboard.
 */
export const getHarvestAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: harvestConfig.clientId,
    response_type: "code",
    redirect_uri: harvestConfig.redirectUri,
    state,
    // Request read-only access (verify scope format with Harvest documentation)
    scope: "harvest:read",
  });

  return `${harvestConfig.authorizationEndpoint}?${params.toString()}`;
};

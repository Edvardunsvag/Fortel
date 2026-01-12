/**
 * Harvest OAuth 2.0 Configuration
 *
 * OAuth credentials from Harvest application settings
 *
 * IMPORTANT: The redirect_uri must match exactly what's configured in your Harvest application.
 * - Development: http://localhost:5173/ (with trailing slash)
 * - Production: https://fortedle.hackathon.forteapps.net
 *
 * Required environment variables:
 * - VITE_HARVEST_CLIENT_ID (required)
 * - VITE_HARVEST_CLIENT_SECRET (required)
 * - VITE_HARVEST_REDIRECT_URI (optional, defaults based on environment)
 */
const getRedirectUri = (): string => {
  // Allow override via environment variable
  if (import.meta.env.VITE_HARVEST_REDIRECT_URI) {
    return import.meta.env.VITE_HARVEST_REDIRECT_URI;
  }

  // In development, use localhost with /harvest path (matches Harvest app settings)
  if (import.meta.env.DEV) {
    return "http://localhost:5173/harvest";
  }

  // In production, use the production URL with /harvest path
  return "https://fortedle.hackathon.forteapps.net/harvest";
};

const clientId = import.meta.env.VITE_HARVEST_CLIENT_ID;
const clientSecret = import.meta.env.VITE_HARVEST_CLIENT_SECRET;

if (!clientId) {
  console.warn(
    "VITE_HARVEST_CLIENT_ID is not set. Harvest OAuth will not work. " +
      "Please set VITE_HARVEST_CLIENT_ID in your .env file or environment variables."
  );
}

if (!clientSecret) {
  console.warn(
    "VITE_HARVEST_CLIENT_SECRET is not set. Harvest OAuth will not work. " +
      "Please set VITE_HARVEST_CLIENT_SECRET in your .env file or environment variables."
  );
}

export const harvestConfig = {
  clientId: clientId || "",
  clientSecret: clientSecret || "",
  redirectUri: getRedirectUri(),
  authorizationEndpoint: "https://id.getharvest.com/oauth2/authorize",
  tokenEndpoint: "https://id.getharvest.com/api/v2/oauth2/token",
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
 */
export const getHarvestAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: harvestConfig.clientId,
    response_type: "code",
    redirect_uri: harvestConfig.redirectUri,
    state,
  });

  return `${harvestConfig.authorizationEndpoint}?${params.toString()}`;
};

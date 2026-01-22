import { Configuration, PopupRequest } from "@azure/msal-browser";

/**
 * Azure AD MSAL Configuration
 *
 * To configure:
 * 1. Register your app in Azure AD Portal
 * 2. Get your Client ID and Tenant ID
 * 3. Set redirect URI (e.g., http://localhost:5173 for dev, your production URL for prod)
 * 4. Set environment variables:
 *    - VITE_AZURE_CLIENT_ID (required)
 *    - VITE_AZURE_TENANT_ID (optional, defaults to 'common')
 *    - VITE_AZURE_REDIRECT_URI (optional, defaults to current origin)
 */
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;

// Configuration validation happens at runtime - errors will be handled by the application

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

/**
 * Get the API scope from environment variable
 * This should be the full scope URI: api://<client-id>/access_as_user
 * Or use {client-id}/.default as a fallback if API is not exposed
 */
const getApiScope = (): string | null => {
  const apiScope = import.meta.env.VITE_AZURE_API_SCOPE;
  if (!apiScope) {
    return null;
  }
  
  // If the API scope format is api://client-id/scope-name and it fails,
  // try using {client-id}/.default as a fallback
  // This requests all permissions for the app
  if (apiScope.startsWith("api://") && clientId) {
    // Try the custom scope first, but also support .default fallback
    return apiScope;
  }
  
  return apiScope;
};

/**
 * Get fallback scope using .default format
 * This can be used if the custom API scope is not exposed in Azure AD
 */
const getDefaultScope = (): string | null => {
  if (!clientId) {
    return null;
  }
  return `${clientId}/.default`;
};

/**
 * Add scopes here for ID token and access token.
 * For backend API authentication, we only request the API scope.
 * 
 * Note: When requesting scopes from different resources (e.g., Microsoft Graph and custom API),
 * MSAL returns a token for the first resource. To get a token for our API, we must request ONLY
 * the API scope, not User.Read or other Microsoft Graph scopes.
 * 
 * If you need Microsoft Graph data (like user profile), request it separately with a different
 * token acquisition call.
 */
export const loginRequest: PopupRequest = {
  scopes: (() => {
    const apiScope = getApiScope();
    const scopes: string[] = [];
    
    // Request only the API scope for backend authentication
    // Do NOT include User.Read here - it causes MSAL to return a Microsoft Graph token
    if (apiScope) {
      scopes.push(apiScope);
    } else {
      // Fallback to .default scope if no custom scope is configured
      const defaultScope = getDefaultScope();
      if (defaultScope) {
        scopes.push(defaultScope);
      }
    }
    
    return scopes;
  })(),
};

/**
 * Add the endpoints here for Microsoft Graph API services you'd like to use.
 */
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

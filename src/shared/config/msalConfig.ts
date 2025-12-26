import { Configuration, PopupRequest } from '@azure/msal-browser';

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

if (!clientId) {
  console.warn(
    'VITE_AZURE_CLIENT_ID is not set. Azure AD authentication will not work. ' +
    'Please set VITE_AZURE_CLIENT_ID in your .env file or environment variables.'
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

/**
 * Add scopes here for ID token to be used at Microsoft identity platform endpoints.
 */
export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
};

/**
 * Add the endpoints here for Microsoft Graph API services you'd like to use.
 */
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};


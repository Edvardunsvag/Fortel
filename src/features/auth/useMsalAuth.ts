import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useAppDispatch } from "@/app/hooks";
import { setAccount, setAccessToken, clearAuth, toSerializableAccount } from "./authSlice";
import { loginRequest, msalConfig } from "@/shared/config/msalConfig";

/**
 * Custom hook to manage MSAL authentication state and sync with Redux
 */
export const useMsalAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  const dispatch = useAppDispatch();

  // Sync MSAL account state with Redux
  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      // Convert to serializable format before dispatching to avoid non-serializable Map in action payload
      const serializableAccount = toSerializableAccount(account);
      dispatch(setAccount(serializableAccount));

      // Get access token silently
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account,
        })
        .then((response) => {
          dispatch(setAccessToken(response.accessToken));
        })
        .catch((error) => {
          console.error("Error acquiring token silently:", error);
          dispatch(setAccessToken(null));
        });
    } else {
      dispatch(clearAuth());
    }
  }, [accounts, instance, dispatch]);

  const handleLogin = async () => {
    // Validate that Azure AD is configured
    if (!msalConfig.auth.clientId || msalConfig.auth.clientId === "") {
      const errorMessage = "Azure AD Client ID is not configured. Please set VITE_AZURE_CLIENT_ID in your .env file.";
      alert(errorMessage);
      return;
    }

    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes("popup")) {
          alert("Login popup was blocked. Please allow popups for this site and try again.");
        } else {
          alert(`Login failed: ${error.message}`);
        }
      } else {
        alert("Login failed. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
      dispatch(clearAuth());
    } catch (error) {
      // Error handling is done silently
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (accounts.length === 0) {
      return null;
    }

    try {
      const account = accounts[0];
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      return null;
    }
  };

  return {
    isAuthenticated: accounts.length > 0,
    isLoading: inProgress === "login" || inProgress === "ssoSilent",
    handleLogin,
    handleLogout,
    getAccessToken,
  };
};

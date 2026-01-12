import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useAppDispatch } from "@/app/hooks";
import { setAccount, setAccessToken, clearAuth, toSerializableAccount } from "./authSlice";
import { loginRequest } from "@/shared/config/msalConfig";

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
          console.error("Failed to acquire token silently:", error);
          dispatch(setAccessToken(null));
        });
    } else {
      dispatch(clearAuth());
    }
  }, [accounts, instance, dispatch]);

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
      dispatch(clearAuth());
    } catch (error) {
      console.error("Logout failed:", error);
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
      console.error("Failed to acquire token:", error);
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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { AccountInfo } from '@azure/msal-browser';

/**
 * Serializable account type - only includes properties we actually use
 * This excludes tenantProfiles (Map) which is not serializable
 */
export interface SerializableAccountInfo {
  name?: string;
  username?: string;
  localAccountId?: string;
}

interface AuthState {
  account: SerializableAccountInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  account: null,
  accessToken: null,
  isAuthenticated: false,
};

/**
 * Converts MSAL AccountInfo to a serializable format
 * by extracting only the properties we need and excluding non-serializable values like Map
 */
export const toSerializableAccount = (account: AccountInfo | null): SerializableAccountInfo | null => {
  if (!account) {
    return null;
  }
  
  return {
    name: account.name,
    username: account.username,
    localAccountId: account.localAccountId,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<SerializableAccountInfo | null>) => {
      state.account = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.account = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAccount, setAccessToken, clearAuth } = authSlice.actions;

export const selectAccount = (state: RootState): SerializableAccountInfo | null => state.auth.account;
export const selectAccessToken = (state: RootState): string | null => state.auth.accessToken;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.isAuthenticated;

export const authReducer = authSlice.reducer;


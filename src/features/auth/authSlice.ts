import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { AccountInfo } from '@azure/msal-browser';

interface AuthState {
  account: AccountInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  account: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<AccountInfo | null>) => {
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

export const selectAccount = (state: RootState): AccountInfo | null => state.auth.account;
export const selectAccessToken = (state: RootState): string | null => state.auth.accessToken;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.isAuthenticated;

export const authReducer = authSlice.reducer;


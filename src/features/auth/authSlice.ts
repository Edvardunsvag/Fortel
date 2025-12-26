import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

interface AuthState {
  accessToken: string | null;
}

const getTokenFromStorage = (): string | null => {
  try {
    const token = localStorage.getItem('huma:accessToken');
    if (!token) return null;
    
    const parsed = JSON.parse(token);
    // Handle array format: ["token"] -> extract first element
    if (Array.isArray(parsed) && parsed.length > 0) {
      return typeof parsed[0] === 'string' ? parsed[0] : null;
    }
    // Handle string format
    if (typeof parsed === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  accessToken: getTokenFromStorage(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
});

export const selectAccessToken = (state: RootState): string | null => state.auth.accessToken;

export const authReducer = authSlice.reducer;


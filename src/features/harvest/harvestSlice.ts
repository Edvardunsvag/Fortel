import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export interface HarvestToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
  accountId: string;
}

interface HarvestState {
  token: HarvestToken | null;
}

const initialState: HarvestState = {
  token: null,
};


const harvestSlice = createSlice({
  name: 'harvest',
  initialState,
  reducers: {
    setTokenFromAuth: (state, action: PayloadAction<HarvestToken>) => {
      state.token = action.payload;
    },
    setTokenFromRefresh: (state, action: PayloadAction<HarvestToken>) => {
      state.token = action.payload;
    },
    setTokenAccountId: (state, action: PayloadAction<string>) => {
      if (state.token) {
        state.token.accountId = action.payload;
      }
    },
    loadTokenFromStorage: (state) => {
      const stored = sessionStorage.getItem('harvest_token');
      if (stored) {
        try {
          const token = JSON.parse(stored) as HarvestToken;
          // Check if token is still valid
          if (Date.now() < token.expiresAt - 60000) {
            // Ensure accountId is set (extract from token if missing)
            if (!token.accountId && token.accessToken) {
              const parts = token.accessToken.split('.');
              if (parts.length >= 2 && parts[0]) {
                token.accountId = parts[0];
              }
            }
            state.token = token;
          } else {
            sessionStorage.removeItem('harvest_token');
          }
        } catch {
          sessionStorage.removeItem('harvest_token');
        }
      }
    },
    clearHarvest: (state) => {
      state.token = null;
      sessionStorage.removeItem('harvest_token');
    },
  },
});

export const {
  setTokenFromAuth,
  setTokenFromRefresh,
  setTokenAccountId,
  loadTokenFromStorage,
  clearHarvest,
} = harvestSlice.actions;

export const selectHarvestToken = (state: RootState) => state.harvest.token;
export const selectIsHarvestAuthenticated = (state: RootState) =>
  state.harvest.token !== null;

export const harvestReducer = harvestSlice.reducer;

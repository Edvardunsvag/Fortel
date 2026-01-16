import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export interface HarvestToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
  accountId: string;
}

export enum LotterySubTab {
  TimeEntries = "timeEntries",
  Rules = "rules",
  Lottery = "lottery",
  Employees = "employees",
}

interface LotteryState {
  token: HarvestToken | null;
  activeSubTab: LotterySubTab;
}

const initialState: LotteryState = {
  token: null,
  activeSubTab: LotterySubTab.TimeEntries,
};

const lotterySlice = createSlice({
  name: "lottery",
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
      const stored = sessionStorage.getItem("harvest_token");
      if (stored) {
        try {
          const token = JSON.parse(stored) as HarvestToken;
          // Check if token is still valid
          if (Date.now() < token.expiresAt - 60000) {
            // Ensure accountId is set (extract from token if missing)
            if (!token.accountId && token.accessToken) {
              const parts = token.accessToken.split(".");
              if (parts.length >= 2 && parts[0]) {
                token.accountId = parts[0];
              }
            }
            state.token = token;
          } else {
            sessionStorage.removeItem("harvest_token");
          }
        } catch {
          sessionStorage.removeItem("harvest_token");
        }
      }
    },
    clearLottery: (state) => {
      state.token = null;
      sessionStorage.removeItem("harvest_token");
    },
    setActiveSubTab: (state, action: PayloadAction<LotterySubTab>) => {
      state.activeSubTab = action.payload;
    },
  },
});

export const {
  setTokenFromAuth,
  setTokenFromRefresh,
  setTokenAccountId,
  loadTokenFromStorage,
  clearLottery,
  setActiveSubTab,
} = lotterySlice.actions;

export const selectLotteryToken = (state: RootState) => state.lottery.token;
export const selectIsLotteryAuthenticated = (state: RootState) => state.lottery.token !== null;
export const selectActiveLotterySubTab = (state: RootState) => state.lottery.activeSubTab;

export const lotteryReducer = lotterySlice.reducer;

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export enum ActiveTab {
  Play = "play",
  Lottery = "lottery",
  TimeBank = "timebank",
  Admin = "admin",
}

interface NavigationState {
  activeTab: ActiveTab;
}

const initialState: NavigationState = {
  activeTab: ActiveTab.Play,
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = navigationSlice.actions;

export const selectActiveTab = (state: RootState): ActiveTab => state.navigation.activeTab;

export const navigationReducer = navigationSlice.reducer;

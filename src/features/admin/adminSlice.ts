import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export enum AdminSubTab {
  EmployeeOfTheDay = "employeeOfTheDay",
  Logging = "logging",
  Lottery = "lottery",
}

interface AdminState {
  activeSubTab: AdminSubTab;
}

const initialState: AdminState = {
  activeSubTab: AdminSubTab.EmployeeOfTheDay,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdminSubTab: (state, action: PayloadAction<AdminSubTab>) => {
      state.activeSubTab = action.payload;
    },
  },
});

export const { setAdminSubTab } = adminSlice.actions;

export const selectAdminSubTab = (state: RootState): AdminSubTab => state.admin.activeSubTab;

export const adminReducer = adminSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export enum LotterySubTab {
  TimeEntries = "timeEntries",
  Rules = "rules",
  Lottery = "lottery",
  Employees = "employees",
  LuckyWheel = "luckyWheel",
}

export type SpinPhase = "idle" | "spinning" | "revealing" | "complete";

export interface MonthlyWinner {
  userId: string;
  name: string;
  image: string | null;
  color: string | null;
  month: string;
  position: number;
  ticketsConsumed: number;
  createdAt: string;
}

export interface WheelState {
  currentSpinIndex: number;
  isSpinning: boolean;
  revealedWinners: MonthlyWinner[];
  spinPhase: SpinPhase;
}

interface LotteryState {
  activeSubTab: LotterySubTab;
  wheel: WheelState;
  autoOpenWeekKey: string | null;
}

const initialWheelState: WheelState = {
  currentSpinIndex: 0,
  isSpinning: false,
  revealedWinners: [],
  spinPhase: "idle",
};

const initialState: LotteryState = {
  activeSubTab: LotterySubTab.TimeEntries,
  wheel: initialWheelState,
  autoOpenWeekKey: null,
};

const lotterySlice = createSlice({
  name: "lottery",
  initialState,
  reducers: {
    clearLottery: () => {
      // Token is now managed by backend, no local state to clear
    },
    setActiveSubTab: (state, action: PayloadAction<LotterySubTab>) => {
      state.activeSubTab = action.payload;
    },
    // Wheel state reducers
    setSpinPhase: (state, action: PayloadAction<SpinPhase>) => {
      state.wheel.spinPhase = action.payload;
      state.wheel.isSpinning = action.payload === "spinning";
    },
    advanceSpinIndex: (state) => {
      state.wheel.currentSpinIndex += 1;
    },
    addRevealedWinner: (state, action: PayloadAction<MonthlyWinner>) => {
      state.wheel.revealedWinners.push(action.payload);
    },
    resetWheel: (state) => {
      state.wheel = initialWheelState;
    },
    setRevealedWinners: (state, action: PayloadAction<MonthlyWinner[]>) => {
      state.wheel.revealedWinners = action.payload;
    },
    setAutoOpenWeekKey: (state, action: PayloadAction<string | null>) => {
      state.autoOpenWeekKey = action.payload;
    },
  },
});

export const {
  clearLottery,
  setActiveSubTab,
  setSpinPhase,
  advanceSpinIndex,
  addRevealedWinner,
  resetWheel,
  setRevealedWinners,
  setAutoOpenWeekKey,
} = lotterySlice.actions;
export const selectActiveLotterySubTab = (state: RootState) => state.lottery.activeSubTab;
export const selectAutoOpenWeekKey = (state: RootState) => state.lottery.autoOpenWeekKey;

// Wheel selectors
export const selectWheelState = (state: RootState) => state.lottery.wheel;
export const selectCurrentSpinIndex = (state: RootState) => state.lottery.wheel.currentSpinIndex;
export const selectIsSpinning = (state: RootState) => state.lottery.wheel.isSpinning;
export const selectRevealedWinners = (state: RootState) => state.lottery.wheel.revealedWinners;
export const selectSpinPhase = (state: RootState) => state.lottery.wheel.spinPhase;

export const lotteryReducer = lotterySlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/app/createAppAsyncThunk';
import type { RootState } from '@/app/store';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  submittedAt: string;
}

export interface LeaderboardData {
  date: string;
  leaderboard: LeaderboardEntry[];
}

interface LeaderboardState {
  data: LeaderboardData | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  submitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  submitError: string | null;
}

const initialState: LeaderboardState = {
  data: null,
  status: 'idle',
  error: null,
  submitStatus: 'idle',
  submitError: null,
};

export const fetchLeaderboard = createAppAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (date?: string) => {
    const url = date ? `/api/leaderboard?date=${date}` : '/api/leaderboard';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`);
    }
    
    return await response.json() as LeaderboardData;
  }
);

export const submitScore = createAppAsyncThunk(
  'leaderboard/submitScore',
  async ({ name, score }: { name: string; score: number }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, score }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit score');
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to submit score'
      );
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to fetch leaderboard';
      })
      // Submit score
      .addCase(submitScore.pending, (state) => {
        state.submitStatus = 'loading';
        state.submitError = null;
      })
      .addCase(submitScore.fulfilled, (state) => {
        state.submitStatus = 'succeeded';
        // Refresh leaderboard after successful submission
        state.status = 'idle';
      })
      .addCase(submitScore.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.payload as string || 'Failed to submit score';
      });
  },
});

export const { clearSubmitStatus } = leaderboardSlice.actions;

export const selectLeaderboard = (state: RootState): LeaderboardData | null =>
  state.leaderboard.data;

export const selectLeaderboardStatus = (state: RootState): LeaderboardState['status'] =>
  state.leaderboard.status;

export const selectLeaderboardError = (state: RootState): string | null =>
  state.leaderboard.error;

export const selectSubmitStatus = (state: RootState): LeaderboardState['submitStatus'] =>
  state.leaderboard.submitStatus;

export const selectSubmitError = (state: RootState): string | null =>
  state.leaderboard.submitError;

export const leaderboardReducer = leaderboardSlice.reducer;


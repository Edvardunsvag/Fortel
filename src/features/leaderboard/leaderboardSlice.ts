import { createSlice } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/app/createAppAsyncThunk';
import type { RootState } from '@/app/store';
import { AsyncStatus } from '@/shared/redux/enums';
import { fetchLeaderboard as fetchLeaderboardApi, submitScore as submitScoreApi } from './api';
import type { LeaderboardState } from './types';

const initialState: LeaderboardState = {
  data: null,
  status: AsyncStatus.Idle,
  error: null,
  submitStatus: AsyncStatus.Idle,
  submitError: null,
};

export const fetchLeaderboard = createAppAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (date: string | undefined, { rejectWithValue }) => {
    try {
      return await fetchLeaderboardApi(date);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch leaderboard'
      );
    }
  }
);

export const submitScore = createAppAsyncThunk(
  'leaderboard/submitScore',
  async (
    { name, score, avatarImageUrl }: { name: string; score: number; avatarImageUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      return await submitScoreApi({ name, score, avatarImageUrl });
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
  
  },
  extraReducers: (builder) => {
    builder
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.status = AsyncStatus.Loading;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.status = AsyncStatus.Succeeded;
        state.data = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.status = AsyncStatus.Failed;
        state.error = action.payload || 'Failed to fetch leaderboard';
      })
      // Submit score
      .addCase(submitScore.pending, (state) => {
        state.submitStatus = AsyncStatus.Loading;
        state.submitError = null;
      })
      .addCase(submitScore.fulfilled, (state) => {
        state.submitStatus = AsyncStatus.Succeeded;
        // Refresh leaderboard after successful submission
        state.status = AsyncStatus.Idle;
      })
      .addCase(submitScore.rejected, (state, action) => {
        state.submitStatus = AsyncStatus.Failed;
        state.submitError = action.payload || 'Failed to submit score';
      });
  },
});


export const selectLeaderboard = (state: RootState): LeaderboardState['data'] =>
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

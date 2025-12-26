import { createSlice } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/app/createAppAsyncThunk';
import { fetchEmployees, syncEmployees } from './api';
import type { Employee, EmployeesState } from './types';
import type { RootState } from '@/app/store';

const initialState: EmployeesState = {
  employees: [],
  status: 'idle',
  error: null,
};

export const loadEmployees = createAppAsyncThunk(
  'employees/loadEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const employees = await fetchEmployees();
      return { employees };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load employees'
      );
    }
  }
);

export const syncEmployeesData = createAppAsyncThunk(
  'employees/syncEmployeesData',
  async (accessToken: string, { rejectWithValue, dispatch }) => {
    try {
      const result = await syncEmployees(accessToken);
      // After successful sync, reload employees (unless already synced)
      if (!result.alreadySynced) {
        await dispatch(loadEmployees());
      }
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to sync employees'
      );
    }
  }
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadEmployees.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.employees = action.payload.employees;
      })
      .addCase(loadEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load employees';
      })
      .addCase(syncEmployeesData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(syncEmployeesData.fulfilled, (_state) => {
        // Status will be updated by loadEmployees that runs after sync
      })
      .addCase(syncEmployeesData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to sync employees';
      });
  },
});

export const selectEmployees = (state: RootState): Employee[] =>
  state.employees.employees;

export const selectEmployeesStatus = (state: RootState): EmployeesState['status'] =>
  state.employees.status;

export const employeesReducer = employeesSlice.reducer;


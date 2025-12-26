import { createSlice } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/app/createAppAsyncThunk';
import { fetchEmployees } from './api';
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
      });
  },
});

export const selectEmployees = (state: RootState): Employee[] =>
  state.employees.employees;

export const selectEmployeesStatus = (state: RootState): EmployeesState['status'] =>
  state.employees.status;

export default employeesSlice.reducer;


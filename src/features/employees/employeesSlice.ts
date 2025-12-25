import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/app/createAppAsyncThunk';
import { fetchEmployees } from './api';
import type { Employee, EmployeesState } from './types';

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
      return employees;
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
      .addCase(loadEmployees.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        state.status = 'succeeded';
        state.employees = action.payload;
      })
      .addCase(loadEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load employees';
      });
  },
});

export const selectEmployees = (state: { employees: EmployeesState }): Employee[] =>
  state.employees.employees;

export const selectEmployeesStatus = (state: { employees: EmployeesState }): EmployeesState['status'] =>
  state.employees.status;

export const selectEmployeesError = (state: { employees: EmployeesState }): string | null =>
  state.employees.error;

export const selectEmployeeById = (state: { employees: EmployeesState }, id: string): Employee | undefined =>
  state.employees.employees.find((emp) => emp.id === id);

export const selectEmployeeByName = (state: { employees: EmployeesState }, name: string): Employee | undefined =>
  state.employees.employees.find(
    (emp) => emp.name.toLowerCase() === name.toLowerCase()
  );

export default employeesSlice.reducer;


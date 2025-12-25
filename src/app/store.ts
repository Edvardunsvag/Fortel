import { configureStore } from '@reduxjs/toolkit';
import { FeatureKey } from '@/shared/redux/enums';
import { employeesReducer } from '@/features/employees';
import { gameReducer } from '@/features/game';

export const store = configureStore({
  reducer: {
    [FeatureKey.Employees]: employeesReducer,
    [FeatureKey.Game]: gameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


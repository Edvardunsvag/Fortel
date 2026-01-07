import { configureStore } from '@reduxjs/toolkit';
import { FeatureKey } from '@/shared/redux/enums';
import { employeesReducer } from '@/features/employees/employeesSlice';
import { gameReducer } from '@/features/game/gameSlice';
import { navigationReducer } from '@/features/sidebar/navigationSlice';
import { authReducer } from '@/features/auth/authSlice';
import { leaderboardReducer } from '@/features/leaderboard/leaderboardSlice';
import { i18nReducer } from '@/features/i18n/i18nSlice';

export const store = configureStore({
  reducer: {
    [FeatureKey.Employees]: employeesReducer,
    [FeatureKey.Game]: gameReducer,
    [FeatureKey.Navigation]: navigationReducer,
    [FeatureKey.Auth]: authReducer,
    [FeatureKey.Leaderboard]: leaderboardReducer,
    [FeatureKey.I18n]: i18nReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


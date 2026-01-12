import { configureStore } from '@reduxjs/toolkit';
import { FeatureKey } from '@/shared/redux/enums';
import { gameReducer } from '@/features/game/gameSlice';
import { navigationReducer } from '@/features/sidebar/navigationSlice';
import { authReducer } from '@/features/auth/authSlice';
import { i18nReducer } from '@/features/i18n/i18nSlice';

export const store = configureStore({
  reducer: {
    [FeatureKey.Game]: gameReducer,
    [FeatureKey.Navigation]: navigationReducer,
    [FeatureKey.Auth]: authReducer,
    [FeatureKey.I18n]: i18nReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


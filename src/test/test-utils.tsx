import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FeatureKey } from '@/shared/redux/enums';
import { employeesReducer } from '@/features/employees/employeesSlice';
import { gameReducer } from '@/features/game/gameSlice';
import { navigationReducer } from '@/features/navigation/navigationSlice';
import { authReducer } from '@/features/auth/authSlice';
import { leaderboardReducer } from '@/features/leaderboard/leaderboardSlice';
import { i18nReducer } from '@/features/i18n/i18nSlice';
import type { RootState } from '@/app/store';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/shared/config/msalConfig';

// Create MSAL instance for tests
const msalInstance = new PublicClientApplication(msalConfig);

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      [FeatureKey.Employees]: employeesReducer,
      [FeatureKey.Game]: gameReducer,
      [FeatureKey.Navigation]: navigationReducer,
      [FeatureKey.Auth]: authReducer,
      [FeatureKey.Leaderboard]: leaderboardReducer,
      [FeatureKey.I18n]: i18nReducer,
    },
    preloadedState: preloadedState as RootState | undefined,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MsalProvider instance={msalInstance}>
        <Provider store={store}>
          {children}
        </Provider>
      </MsalProvider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from '@testing-library/react';


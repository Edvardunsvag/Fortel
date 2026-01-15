import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { FeatureKey } from "@/shared/redux/enums";
import { gameReducer } from "@/features/game/gameSlice";
import { navigationReducer } from "@/features/sidebar/navigationSlice";
import { authReducer } from "@/features/auth/authSlice";
import { i18nReducer } from "@/features/i18n/i18nSlice";
import { lotteryReducer } from "@/features/lottery/lotterySlice";
import type { RootState } from "@/app/store";
import { queryClient } from "@/app/queryClient";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/shared/config/msalConfig";

// Create MSAL instance for tests
const msalInstance = new PublicClientApplication(msalConfig);

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      [FeatureKey.Game]: gameReducer,
      [FeatureKey.Navigation]: navigationReducer,
      [FeatureKey.Auth]: authReducer,
      [FeatureKey.I18n]: i18nReducer,
      [FeatureKey.Lottery]: lotteryReducer,
    },
    preloadedState: preloadedState as RootState | undefined,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState = {}, store = createTestStore(preloadedState), ...renderOptions }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <MsalProvider instance={msalInstance}>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>{children}</Provider>
          </QueryClientProvider>
        </MsalProvider>
      </MemoryRouter>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from "@testing-library/react";

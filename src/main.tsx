import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { store } from './app/store';
import { queryClient } from './app/queryClient';
import { App } from './App';
import { msalConfig } from './shared/config/msalConfig';
import './index.scss';
import './features/i18n/i18n';

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance
  .initialize()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <App />
            </Provider>
          </QueryClientProvider>
        </MsalProvider>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize MSAL:', error);
    // Still render the app even if MSAL initialization fails
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <App />
            </Provider>
          </QueryClientProvider>
        </MsalProvider>
      </React.StrictMode>
    );
  });


import { useEffect } from 'react';
import styles from './App.module.scss';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { Leaderboard } from './components/Pages/Leaderboard';
import { Play } from './components/Pages/Play';
import { Rules } from './components/Pages/Rules';
import { Sync } from './components/Pages/Sync';
import { Employees } from './components/Pages/Employees';
import { Sidebar } from './components/Sidebar/Sidebar';
import { LoginScreen } from './components/LoginScreen/LoginScreen';
import { loadEmployees, selectEmployees, selectEmployeesStatus } from './features/employees';
import { ActiveTab, selectActiveTab } from './features/navigation';
import { useI18nSync } from './features/i18n/useI18nSync';
import { useMsalAuth } from './features/auth/useMsalAuth';
import { selectIsAuthenticated, selectAccount } from './features/auth';
import { ADMIN_ACCOUNT } from './shared/config/adminConfig';
import { AsyncStatus } from './shared/redux/enums';

export const App = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const account = useAppSelector(selectAccount);
  const isAdmin = account?.username === ADMIN_ACCOUNT;
  
  // Sync i18n with Redux language state
  useI18nSync();
  
  // Initialize MSAL auth state
  useMsalAuth();

  useEffect(() => {
    // Try to load employees from database on mount only
    // Only load if status is 'idle' (initial state) and we haven't loaded yet
    // Only load if authenticated
    if (isAuthenticated && employeesStatus === AsyncStatus.Idle && employees.length === 0) {
      dispatch(loadEmployees());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Run when authentication state changes

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case ActiveTab.Play:
        return <Play />;
      case ActiveTab.Leaderboard:
        return <Leaderboard />;
      case ActiveTab.Rules:
        return <Rules />;
      case ActiveTab.Sync:
        // Only allow admin to access sync page
        if (!isAdmin) {
          return <Play />;
        }
        return <Sync />;
      case ActiveTab.Employees:
        return <Employees />;
      default:
        return <Play />;
    }
  };

  return (
    <div className={styles.app}>
      <Sidebar />
      {renderPage()}
    </div>

  );
};


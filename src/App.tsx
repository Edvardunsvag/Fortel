import { useEffect } from 'react';
import styles from './App.module.scss';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { Leaderboard } from './components/Pages/Leaderboard';
import { Play } from './components/Pages/Play';
import { Rules } from './components/Pages/Rules';
import { Sync } from './components/Pages/Sync';
import { Employees } from './components/Pages/Employees';
import { Sidebar } from './components/Sidebar/Sidebar';
import { loadEmployees, selectEmployees, selectEmployeesStatus } from './features/employees';
import { ActiveTab, selectActiveTab } from './features/navigation';
import { useI18nSync } from './features/i18n/useI18nSync';
import { useMsalAuth } from './features/auth/useMsalAuth';

export const App = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  
  // Sync i18n with Redux language state
  useI18nSync();
  
  // Initialize MSAL auth state
  useMsalAuth();

  useEffect(() => {
    // Try to load employees from database on mount only
    // Only load if status is 'idle' (initial state) and we haven't loaded yet
    if (employeesStatus === 'idle' && employees.length === 0) {
      dispatch(loadEmployees());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const renderPage = () => {
    switch (activeTab) {
      case ActiveTab.Play:
        return <Play />;
      case ActiveTab.Leaderboard:
        return <Leaderboard />;
      case ActiveTab.Rules:
        return <Rules />;
      case ActiveTab.Sync:
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


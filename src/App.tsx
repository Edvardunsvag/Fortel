import styles from './App.module.scss';
import { useAppSelector } from './app/hooks';
import { LeaderboardPage } from './features/leaderboard/LeaderboardPage/LeaderboardPage';
import { Game } from './features/game/Game/Game';
import { RulesPage } from './features/game/RulesPage/RulesPage';
import { SyncPage } from './features/employees/SyncPage/SyncPage';
import { EmployeesPage } from './features/employees/EmployeesPage/EmployeesPage';
import { LoginScreen } from './features/auth/LoginScreen/LoginScreen';
import { ActiveTab, selectActiveTab } from './features/sidebar/navigationSlice';
import { useI18nSync } from './features/i18n/useI18nSync';
import { useMsalAuth } from './features/auth/useMsalAuth';
import { selectIsAuthenticated, selectAccount } from './features/auth/authSlice';
import { ADMIN_ACCOUNT } from './shared/config/adminConfig';
import { Sidebar } from './features/sidebar/Sidebar/Sidebar';

export const App = () => {
  const activeTab = useAppSelector(selectActiveTab);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const account = useAppSelector(selectAccount);
  const isAdmin = account?.username === ADMIN_ACCOUNT;
  
  useI18nSync();  
  useMsalAuth();

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case ActiveTab.Play:
        return <Game />;
      case ActiveTab.Leaderboard:
        return <LeaderboardPage />;
      case ActiveTab.Rules:
        return <RulesPage />;
      case ActiveTab.Sync:
        // Only allow admin to access sync page
        if (!isAdmin) {
          return <Game />;
        }
        return <SyncPage />;
      case ActiveTab.Employees:
        return <EmployeesPage />;
      default:
        return <Game />;
    }
  };

  return (
    <div className={styles.app}>
      <Sidebar />
      {renderPage()}
    </div>

  );
};


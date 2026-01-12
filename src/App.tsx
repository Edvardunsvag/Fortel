import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import styles from "./App.module.scss";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { LeaderboardPage } from "./features/leaderboard/LeaderboardPage/LeaderboardPage";
import { Game } from "./features/game/Game/Game";
import { RulesPage } from "./features/game/RulesPage/RulesPage";
import { SyncPage } from "./features/employees/SyncPage/SyncPage";
import { EmployeesPage } from "./features/employees/EmployeesPage/EmployeesPage";
import { HarvestPage } from "./features/harvest/HarvestPage/HarvestPage";
import { LoginScreen } from "./features/auth/LoginScreen/LoginScreen";
import { ActiveTab, setActiveTab } from "./features/sidebar/navigationSlice";
import { GameSubTab, setActiveSubTab } from "./features/game";
import { useI18nSync } from "./features/i18n/useI18nSync";
import { useMsalAuth } from "./features/auth/useMsalAuth";
import { selectIsAuthenticated, selectAccount } from "./features/auth/authSlice";
import { ADMIN_ACCOUNT } from "./shared/config/adminConfig";
import { Sidebar } from "./features/sidebar/Sidebar/Sidebar";
import { routes, routeToTab } from "./shared/routes";
import { useEffect } from "react";

export const App = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const account = useAppSelector(selectAccount);
  const isAdmin = account?.username === ADMIN_ACCOUNT;

  useI18nSync();
  useMsalAuth();

  // Sync URL with Redux state
  useEffect(() => {
    const path = location.pathname;
    const tab = routeToTab[path];
    if (tab) {
      // Set ActiveTab for sidebar navigation
      // All game-related routes (play, leaderboard, rules, employees, sync) should show Play as active
      if (tab === "play" || tab === "leaderboard" || tab === "rules" || tab === "employees" || tab === "sync") {
        dispatch(setActiveTab(ActiveTab.Play));
      } else if (tab === "harvest") {
        dispatch(setActiveTab(ActiveTab.Harvest));
      }
      
      // Sync Game sub-navigation for Fortedle-related routes
      const gameSubTabMap: Record<string, GameSubTab> = {
        [routes.play]: GameSubTab.Play,
        [routes.leaderboard]: GameSubTab.Leaderboard,
        [routes.rules]: GameSubTab.Rules,
        [routes.employees]: GameSubTab.Employees,
        [routes.sync]: GameSubTab.Sync,
      };
      
      const gameSubTab = gameSubTabMap[path];
      if (gameSubTab) {
        dispatch(setActiveSubTab(gameSubTab));
      }
    }
  }, [location.pathname, dispatch]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.app}>
      <Sidebar />
      <Routes>
        <Route path={routes.play} element={<Game />} />
        <Route path={routes.leaderboard} element={<LeaderboardPage />} />
        <Route path={routes.rules} element={<RulesPage />} />
        <Route path={routes.employees} element={<EmployeesPage />} />
        <Route path={routes.harvest} element={<HarvestPage />} />
        <Route path={routes.sync} element={isAdmin ? <SyncPage /> : <Navigate to={routes.play} replace />} />
        <Route path="*" element={<Navigate to={routes.play} replace />} />
      </Routes>
    </div>
  );
};

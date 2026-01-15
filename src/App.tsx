import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import styles from "./App.module.scss";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { Game } from "./features/game/Game/Game";
import { RulesPage } from "./features/game/RulesPage/RulesPage";

import { LotteryPage } from "./features/lottery/LotteryPage/LotteryPage";
import { LoginScreen } from "./features/auth/LoginScreen/LoginScreen";
import { ActiveTab, setActiveTab } from "./features/sidebar/navigationSlice";
import { GameSubTab, setActiveSubTab } from "./features/game";
import { useI18nSync } from "./features/i18n/useI18nSync";
import { useMsalAuth } from "./features/auth/useMsalAuth";
import { selectIsAuthenticated, selectAccount } from "./features/auth/authSlice";
import { isAdminAccount } from "./shared/config/adminConfig";
import { Sidebar } from "./features/sidebar/Sidebar/Sidebar";
import { routes, routeToTab } from "./shared/routes";
import { useEffect } from "react";
import { LeaderboardPage } from "./features/game/leaderboard/LeaderboardPage/LeaderboardPage";
import { EmployeesPage } from "./features/game/employees/EmployeesPage/EmployeesPage";
import { SyncPage } from "./features/game/employees/SyncPage/SyncPage";

export const App = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const account = useAppSelector(selectAccount);
  const isAdmin = isAdminAccount(account?.username);

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
      } else if (tab === "lottery") {
        dispatch(setActiveTab(ActiveTab.Lottery));
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
        <Route path={routes.lottery} element={<LotteryPage />} />
        <Route path={routes.sync} element={isAdmin ? <SyncPage /> : <Navigate to={routes.play} replace />} />
        <Route path="*" element={<Navigate to={routes.play} replace />} />
      </Routes>
    </div>
  );
};

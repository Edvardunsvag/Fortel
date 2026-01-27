import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./App.module.scss";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { GamePage } from "./features/game/GamePage/GamePage";
import { LotteryPage } from "./features/lottery/LotteryPage/LotteryPage";
import { TimeBankPage } from "./features/timebank";
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
import { AdminPage } from "./features/admin";
import { ErrorBoundary } from "./shared/components";

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
      if (tab === "play" || tab === "leaderboard" || tab === "rules" || tab === "employees") {
        dispatch(setActiveTab(ActiveTab.Play));
      } else if (tab === "lottery") {
        dispatch(setActiveTab(ActiveTab.Lottery));
      } else if (tab === "timebank") {
        dispatch(setActiveTab(ActiveTab.TimeBank));
      } else if (tab === "admin") {
        dispatch(setActiveTab(ActiveTab.Admin));
      }

      // Sync Game sub-navigation for Fortedle-related routes
      const gameSubTabMap: Record<string, GameSubTab> = {
        [routes.play]: GameSubTab.Play,
        [routes.leaderboard]: GameSubTab.Leaderboard,
        [routes.rules]: GameSubTab.Rules,
        [routes.employees]: GameSubTab.Employees,
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
        <Route path={routes.play} element={<GamePage />} />
        <Route path={routes.leaderboard} element={<GamePage />} />
        <Route path={routes.rules} element={<GamePage />} />
        <Route path={routes.employees} element={<GamePage />} />
        <Route path={routes.lottery} element={<LotteryPage />} />
        <Route path={routes.timebank} element={<TimeBankPage />} />
        <Route path={routes.sync} element={isAdmin ? <Navigate to={routes.admin} replace /> : <Navigate to={routes.play} replace />} />
        <Route path={routes.admin} element={isAdmin ? <AdminPage /> : <Navigate to={routes.play} replace />} />
        <Route path="*" element={<Navigate to={routes.play} replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

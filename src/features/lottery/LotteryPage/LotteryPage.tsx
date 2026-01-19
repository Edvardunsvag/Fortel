import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  clearLottery,
  loadTokenFromStorage,
  selectIsLotteryAuthenticated,
  selectActiveLotterySubTab,
  LotterySubTab,
} from "../lotterySlice";
import { useLotteryUser, useEmployeeWeeks, useAuthenticateLottery, useTestLotteryApi } from "../queries";
import { getHarvestAuthUrl, generateState } from "@/shared/config/harvestConfig";
import { routes } from "@/shared/routes";
import { useTranslation } from "react-i18next";
import { LotteryNavigationChips } from "./LotteryNavigationChips";
import { UserInfo } from "./UserInfo";
import { ConnectToHarvest } from "./ConnectToHarvest";
import { YourHours } from "../DineTimer/YourHours";
import { Regler } from "../Regler/Regler";
import { Lotteri } from "../Lotteri/Lotteri";
import { EmployeeStatistics } from "./EmployeeStatistics";
import { LuckyWheel } from "../LuckyWheel";
import styles from "./LotteryPage.module.scss";

export const LotteryPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsLotteryAuthenticated);
  const activeSubTab = useAppSelector(selectActiveLotterySubTab);

  // TanStack Query hooks
  const authenticateMutation = useAuthenticateLottery();
  const testApiMutation = useTestLotteryApi();
  const { data: user, isLoading: isLoadingUser, error: userError } = useLotteryUser(isAuthenticated);
  const userId = user?.id.toString() || null;

  const {
    data: weeksData,
    isLoading: isLoadingWeeks,
    error: weeksError,
  } = useEmployeeWeeks(userId, isAuthenticated && !!userId);

  const isLoading = isLoadingUser || isLoadingWeeks || authenticateMutation.isPending || testApiMutation.isPending;
  const error =
    userError?.message ||
    weeksError?.message ||
    authenticateMutation.error?.message ||
    testApiMutation.error?.message;

  // Calculate stats from employee weeks (synced from backend)
  const weeklyData = weeksData?.weeks || [];
  const totalLotteryTickets = weeklyData.filter((week) => week.hasTicket).length;

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");

    if (errorParam) {
      console.error("OAuth error:", errorParam);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (code && state && !authenticateMutation.isPending && !authenticateMutation.isSuccess) {
      authenticateMutation.mutate({ code, state });
      // Ensure we stay on Lottery tab by navigating to /lottery
      navigate(routes.lottery, { replace: true });
      // Clean up URL params
      window.history.replaceState({}, "", routes.lottery);
    }
  }, [authenticateMutation, navigate]);

  // Load token from storage on mount
  useEffect(() => {
    dispatch(loadTokenFromStorage());
  }, [dispatch]);

  const handleLogin = () => {
    const state = generateState();
    sessionStorage.setItem("harvest_oauth_state", state);
    window.location.href = getHarvestAuthUrl(state);
  };

  const handleLogout = () => {
    dispatch(clearLottery());
  };

  const handleTestApi = () => {
    testApiMutation.mutate();
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("lottery.title")}</h1>
        {!isAuthenticated ? (
          <ConnectToHarvest error={error} isLoading={isLoading} onLogin={handleLogin} onTestApi={handleTestApi} />
        ) : (
          <div className={styles.authenticated}>
            <UserInfo
              user={user}
              weeklyDataLength={weeklyData.length}
              totalLotteryTickets={totalLotteryTickets}
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>

      <div className={styles.container}>
        <LotteryNavigationChips />

        {activeSubTab === LotterySubTab.TimeEntries && <YourHours isAuthenticated={isAuthenticated} error={error} />}

        {activeSubTab === LotterySubTab.Rules && <Regler />}

        {activeSubTab === LotterySubTab.Lottery && <Lotteri />}

        {activeSubTab === LotterySubTab.Employees && <EmployeeStatistics />}

        {activeSubTab === LotterySubTab.LuckyWheel && <LuckyWheel isAuthenticated={isAuthenticated} />}
      </div>
    </div>
  );
};

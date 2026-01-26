import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  selectActiveLotterySubTab,
  LotterySubTab,
} from "../lotterySlice";
import { useLotteryUser, useAuthenticateLottery, useHarvestTokenStatus } from "../queries";
import { getHarvestAuthUrl, generateState } from "@/shared/config/harvestConfig";
import { routes } from "@/shared/routes";
import { useTranslation } from "react-i18next";
import { LotteryNavigationChips } from "./LotteryNavigationChips";
import { YourTickets } from "../YourTickets/YourTickets";
import { Regler } from "../Regler/Regler";
import { Lotteri } from "../Lotteri/Lotteri";
import { EmployeeStatistics } from "./EmployeeStatistics";
import { LuckyWheel } from "../LuckyWheel";
import styles from "./LotteryPage.module.scss";

export const LotteryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeSubTab = useAppSelector(selectActiveLotterySubTab);

  // TanStack Query hooks
  const { data: harvestStatus } = useHarvestTokenStatus();
  const isAuthenticated = harvestStatus?.is_authenticated ?? false;
  const authenticateMutation = useAuthenticateLottery();
  const { isLoading: isLoadingUser, error: userError } = useLotteryUser(isAuthenticated);

  const isLoading = isLoadingUser || authenticateMutation.isPending;
  const error = userError?.message || authenticateMutation.error?.message;

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");

    if (errorParam) {
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

  const handleLogin = () => {
    const state = generateState();
    // Store OAuth state temporarily (not sensitive token data)
    localStorage.setItem("harvest_oauth_state", state);
    window.location.href = getHarvestAuthUrl(state);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("lottery.title")}</h1>
        <LotteryNavigationChips />

        {activeSubTab === LotterySubTab.TimeEntries && (
          <YourTickets
            isAuthenticated={isAuthenticated}
            error={error}
            isLoading={isLoading}
            onLogin={handleLogin}
          />
        )}

        {activeSubTab === LotterySubTab.Rules && <Regler />}

        {activeSubTab === LotterySubTab.Lottery && <Lotteri />}

        {activeSubTab === LotterySubTab.Employees && <EmployeeStatistics />}

        {activeSubTab === LotterySubTab.LuckyWheel && <LuckyWheel isAuthenticated={isAuthenticated} />}
      </div>
    </div>
  );
};

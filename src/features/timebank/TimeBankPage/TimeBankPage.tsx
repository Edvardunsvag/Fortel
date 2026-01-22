import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, subMonths } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  loadTokenFromStorage,
  selectIsLotteryAuthenticated,
  clearLottery,
} from "@/features/lottery/lotterySlice";
import { useLotteryTimeEntries, useAuthenticateLottery } from "@/features/lottery/queries";
import { getHarvestAuthUrl, generateState } from "@/shared/config/harvestConfig";
import { routes } from "@/shared/routes";
import { Timeframe } from "../types";
import type { DateRange } from "../types";
import { getDateRangeForTimeframe, calculateTimeBalance, calculateFagtimerBalance } from "../timebankUtils";
import { TimeBankNavigationChips, TimeBankSubTab } from "./TimeBankNavigationChips";
import { TimeframeSelector } from "./TimeframeSelector";
import { TimeBalanceCard } from "./TimeBalanceCard";
import { FagtimerCard } from "./FagtimerCard";
import { WeeklyBreakdown } from "./WeeklyBreakdown";
import { ProjectBreakdown } from "./ProjectBreakdown";
import { AiEncouragement } from "./AiEncouragement";
import { TimeBankRules } from "./TimeBankRules";
import styles from "./TimeBankPage.module.scss";

export const TimeBankPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsLotteryAuthenticated);

  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.YearToDate);
  const [activeSubTab, setActiveSubTab] = useState<TimeBankSubTab>(TimeBankSubTab.Data);

  // Custom date range state (default to last 3 months)
  const [customRange, setCustomRange] = useState<DateRange>(() => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    return {
      from: format(threeMonthsAgo, "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    };
  });

  // Get the effective date range based on timeframe selection
  const dateRange = useMemo(() => {
    if (timeframe === Timeframe.Custom) {
      return customRange;
    }
    return getDateRangeForTimeframe(timeframe);
  }, [timeframe, customRange]);

  // Reuse lottery authentication
  const authenticateMutation = useAuthenticateLottery();

  // Fetch time entries for the selected date range
  const {
    data: timeEntries = [],
    isLoading,
    error,
  } = useLotteryTimeEntries(dateRange.from, dateRange.to, isAuthenticated);

  // Calculate time balance
  const timeBalance = useMemo(() => {
    if (!timeEntries.length) {
      return {
        totalLogged: 0,
        totalExpected: 0,
        balance: 0,
        weeklyBreakdown: [],
      };
    }
    return calculateTimeBalance(timeEntries, dateRange);
  }, [timeEntries, dateRange]);

  // Calculate fagtimer balance
  const fagtimerBalance = useMemo(() => {
    return calculateFagtimerBalance(timeEntries, dateRange);
  }, [timeEntries, dateRange]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");

    if (errorParam) {
      console.error("OAuth error:", errorParam);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (code && state && !authenticateMutation.isPending && !authenticateMutation.isSuccess) {
      authenticateMutation.mutate({ code, state });
      navigate(routes.timebank, { replace: true });
      window.history.replaceState({}, "", routes.timebank);
    }
  }, [authenticateMutation, navigate]);

  // Load token from storage on mount
  useEffect(() => {
    dispatch(loadTokenFromStorage());
  }, [dispatch]);

  const handleLogin = () => {
    const state = generateState();
    sessionStorage.setItem("harvest_oauth_state", state);
    // Store redirect to timebank after auth
    sessionStorage.setItem("harvest_oauth_redirect", routes.timebank);
    window.location.href = getHarvestAuthUrl(state);
  };

  const handleLogout = () => {
    dispatch(clearLottery());
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {!isAuthenticated ? (
          <>
            <h1 className={styles.title}>{t("timebank.title")}</h1>
            <div className={styles.connectSection}>
              <p className={styles.connectText}>{t("timebank.connectDescription")}</p>
              {error && <div className={styles.error}>{error.message}</div>}
              <button
                className={styles.connectButton}
                onClick={handleLogin}
                disabled={authenticateMutation.isPending}
              >
                {authenticateMutation.isPending ? t("timebank.connecting") : t("timebank.connectToHarvest")}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className={styles.header}>
              <h1 className={styles.title}>{t("timebank.title")}</h1>
            </div>

            <TimeBankNavigationChips activeTab={activeSubTab} onTabChange={setActiveSubTab} />

            {activeSubTab === TimeBankSubTab.Data && (
              <>
                <div className={styles.timeframeRow}>
                  <TimeframeSelector
                    selected={timeframe}
                    onChange={setTimeframe}
                    customRange={customRange}
                    onCustomRangeChange={setCustomRange}
                  />
                </div>

                {isLoading ? (
                  <div className={styles.loading}>{t("timebank.loading")}</div>
                ) : error ? (
                  <div className={styles.error}>{error.message}</div>
                ) : (
                  <>
                    <AiEncouragement timeBalance={timeBalance} fagtimerBalance={fagtimerBalance} />

                    <div className={styles.balanceRow}>
                      <TimeBalanceCard balance={timeBalance} />
                      <FagtimerCard balance={fagtimerBalance} />
                    </div>

                    {timeBalance.weeklyBreakdown.length > 0 && (
                      <>
                        <ProjectBreakdown weeks={timeBalance.weeklyBreakdown} />
                        <WeeklyBreakdown weeks={timeBalance.weeklyBreakdown} />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {activeSubTab === TimeBankSubTab.Rules && <TimeBankRules />}

            <button className={styles.disconnectButton} onClick={handleLogout}>
              {t("timebank.disconnect")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

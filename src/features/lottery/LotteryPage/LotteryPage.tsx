import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearLottery, loadTokenFromStorage, selectIsLotteryAuthenticated, selectLotteryToken } from "../lotterySlice";
import { useLotteryUser, useLotteryTimeEntries, useAuthenticateLottery, useTestLotteryApi } from "../queries";
import { checkLotteryEligibility } from "../lotteryUtils";
import { getHarvestAuthUrl, generateState } from "@/shared/config/harvestConfig";
import { routes } from "@/shared/routes";
import { useTranslation } from "react-i18next";
import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays, format } from "date-fns";
import styles from "./LotteryPage.module.scss";

export const LotteryPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector(selectLotteryToken);
  const isAuthenticated = useAppSelector(selectIsLotteryAuthenticated);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const hasAutoFetched = useRef(false);

  // Helper function to format timestamp in a readable way
  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const language = i18n.language || localStorage.getItem("fortedle_language") || "en";
    const locale = language === "nb" ? "nb-NO" : "en-US";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // TanStack Query hooks
  const authenticateMutation = useAuthenticateLottery();
  const testApiMutation = useTestLotteryApi();
  const { data: user, isLoading: isLoadingUser, error: userError } = useLotteryUser(isAuthenticated);

  // Calculate date range from selected month
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const from = firstDay.toISOString().split("T")[0];
      const to = lastDay.toISOString().split("T")[0];
      setFromDate(from);
      setToDate(to);
      setDateRange({ from, to });
    }
  }, [selectedMonth]);

  const {
    data: timeEntries = [],
    isLoading: isLoadingEntries,
    error: entriesError,
  } = useLotteryTimeEntries(fromDate, toDate, isAuthenticated && !!fromDate && !!toDate);

  const isLoading = isLoadingUser || isLoadingEntries || authenticateMutation.isPending || testApiMutation.isPending;
  const error =
    userError?.message ||
    entriesError?.message ||
    authenticateMutation.error?.message ||
    testApiMutation.error?.message;

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
      hasAutoFetched.current = false; // Reset flag to allow auto-fetch after auth
    }
  }, [authenticateMutation, navigate]);

  // Load token from storage on mount
  useEffect(() => {
    dispatch(loadTokenFromStorage());
  }, [dispatch]);

  // Set default month to current month
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${year}-${month}`);
  }, []);

  // Auto-fetch current month after authentication completes
  // The query will automatically fetch when enabled conditions are met
  useEffect(() => {
    if (
      isAuthenticated &&
      token &&
      !hasAutoFetched.current &&
      timeEntries.length === 0 &&
      !isLoading &&
      selectedMonth &&
      fromDate &&
      toDate
    ) {
      hasAutoFetched.current = true;
    }
  }, [isAuthenticated, token, timeEntries.length, isLoading, selectedMonth, fromDate, toDate]);

  // Reset auto-fetch flag when month changes
  useEffect(() => {
    hasAutoFetched.current = false;
  }, [selectedMonth]);

  const handleLogin = () => {
    const state = generateState();
    sessionStorage.setItem("harvest_oauth_state", state);
    window.location.href = getHarvestAuthUrl(state);
  };

  const handleFetchData = () => {
    // The query will automatically refetch when fromDate/toDate change
    // This is handled by the useEffect that sets fromDate/toDate from selectedMonth
    // We just need to reset the auto-fetch flag to allow refetching
    hasAutoFetched.current = false;
  };

  const handleLogout = () => {
    dispatch(clearLottery());
  };

  const handleTestApi = () => {
    testApiMutation.mutate();
  };

  const toggleWeek = (weekStart: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) {
        next.delete(weekStart);
      } else {
        next.add(weekStart);
      }
      return next;
    });
  };

  const handleWeekKeyDown = (event: React.KeyboardEvent, weekStart: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleWeek(weekStart);
    }
  };

  // Group time entries by week using ISO week numbers
  const groupEntriesByWeek = () => {
    const weeks: { [key: string]: typeof timeEntries } = {};

    timeEntries.forEach((entry) => {
      // Parse the spent_date (YYYY-MM-DD format)
      const [year, month, day] = entry.spent_date.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      // Get ISO week number and year (handles year boundaries correctly)
      const weekNumber = getISOWeek(date);
      const weekYear = getISOWeekYear(date);

      // Create a unique key for this week: "2024-W01" format
      const weekKey = `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(entry);
    });

    // Sort weeks by year and week number (newest first)
    return Object.entries(weeks)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, entries]) => {
        // Get Monday of the week from any entry in this week
        const [year, month, day] = entries[0].spent_date.split("-").map(Number);
        const sampleDate = new Date(year, month - 1, day);
        const monday = startOfISOWeek(sampleDate);
        const friday = addDays(monday, 4);

        // Format dates as YYYY-MM-DD
        const weekStart = format(monday, "yyyy-MM-dd");
        const weekEnd = format(friday, "yyyy-MM-dd");

        const weekHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

        // Check lottery eligibility
        const lotteryCheck = checkLotteryEligibility(entries, weekEnd);

        return {
          weekKey, // e.g., "2024-W01"
          weekStart, // e.g., "2024-01-01" (Monday)
          weekEnd, // e.g., "2024-01-05" (Friday)
          entries,
          hours: weekHours,
          isLotteryEligible: lotteryCheck.isEligible,
          lotteryReason: lotteryCheck.reason,
          lotteryReasonKey: lotteryCheck.reasonKey,
          lotteryReasonData: lotteryCheck.reasonData,
        };
      });
  };

  const weeklyData = groupEntriesByWeek();
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalLotteryTickets = weeklyData.filter((week) => week.isLotteryEligible).length;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("lottery.title")}</h1>

        {!isAuthenticated ? (
          <div className={styles.loginForm}>
            <p className={styles.description}>{t("lottery.description")}</p>

            {error && <div className={styles.error}>{error}</div>}

            <button onClick={handleLogin} className={styles.button} disabled={isLoading} type="button">
              {isLoading ? t("lottery.connecting") : t("lottery.connect")}
            </button>

            {token && (
              <div className={styles.testSection}>
                <p className={styles.testDescription}>Token received! Test API calls:</p>
                <button onClick={handleTestApi} className={styles.testButton} disabled={isLoading} type="button">
                  {isLoading ? "Testing..." : "Test API Calls"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.authenticated}>
            <div className={styles.userInfo}>
              <div className={styles.userInfoHeader}>
                <h2 className={styles.userWelcome}>
                  {t("lottery.welcome")}, {user?.first_name} {user?.last_name}!
                </h2>
                {weeklyData.length > 0 && (
                  <div className={styles.lotteryTicketsCount}>
                    <span className={styles.ticketIcon}>🎫</span>
                    <span className={styles.ticketCount}>
                      {t("lottery.ticketsSaved", { count: totalLotteryTickets })}
                    </span>
                  </div>
                )}
              </div>
              <p>
                <strong>{t("lottery.email")}:</strong> {user?.email}
              </p>
              <p>
                <strong>{t("lottery.userId")}:</strong> {user?.id}
              </p>
              <button onClick={handleLogout} className={styles.logoutButton} type="button">
                {t("lottery.disconnect")}
              </button>
            </div>

            <div className={styles.dataSection}>
              <h3>{t("lottery.fetchEntries")}</h3>

              <div className={styles.monthSelector}>
                <div className={styles.formGroup}>
                  <label htmlFor="selectedMonth" className={styles.label}>
                    {t("lottery.selectMonth")}
                  </label>
                  <input
                    id="selectedMonth"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <button
                onClick={handleFetchData}
                className={styles.button}
                disabled={isLoading || !selectedMonth}
                type="button"
              >
                {isLoading ? t("lottery.loading") : t("lottery.getEntries")}
              </button>

              {error && <div className={styles.error}>{error}</div>}

              {timeEntries.length > 0 && (
                <div className={styles.results}>
                  <h4>{t("lottery.results")}</h4>
                  <p className={styles.summary}>
                    {t("lottery.foundEntries", { count: timeEntries.length })}
                    {dateRange && (
                      <>
                        {" "}
                        {t("lottery.from")} {dateRange.from} {t("lottery.to")} {dateRange.to}
                      </>
                    )}
                    <br />
                    <strong>
                      {t("lottery.totalHours")}: {totalHours.toFixed(2)}
                    </strong>
                  </p>

                  <div className={styles.weeksList}>
                    {weeklyData.map((week) => {
                      const isOpen = openWeeks.has(week.weekStart);
                      return (
                        <div key={week.weekStart} className={styles.week}>
                          <div
                            className={styles.weekHeader}
                            onClick={() => toggleWeek(week.weekStart)}
                            onKeyDown={(e) => handleWeekKeyDown(e, week.weekStart)}
                            role="button"
                            tabIndex={0}
                            aria-expanded={isOpen}
                            aria-controls={`week-${week.weekStart}`}
                          >
                            <div className={styles.weekHeaderContent}>
                              <div className={styles.weekTitleContainer}>
                                <div className={styles.weekTitleWrapper}>
                                  <h5 className={styles.weekTitle}>
                                    {t("lottery.week")}: {week.weekStart} - {week.weekEnd}
                                  </h5>
                                  {week.isLotteryEligible && (
                                    <span
                                      className={styles.lotteryTicket}
                                      title="This week qualifies for 1 lottery ticket! 🎫"
                                      aria-label="Lottery ticket earned"
                                    >
                                      🎫
                                    </span>
                                  )}
                                </div>
                                {!week.isLotteryEligible && week.lotteryReasonKey && (
                                  <p className={styles.lotteryReason} aria-live="polite">
                                    {week.lotteryReasonKey === "missingHours" && week.lotteryReasonData?.missingDays
                                      ? t("lottery.eligibility.missingHours", {
                                          dates: week.lotteryReasonData.missingDays.join(", "),
                                        })
                                      : week.lotteryReasonKey === "entriesUpdatedAfterDeadline" &&
                                        week.lotteryReasonData?.latestUpdate &&
                                        t("lottery.eligibility.entriesUpdatedAfterDeadline", {
                                          timestamp: formatTimestamp(week.lotteryReasonData.latestUpdate),
                                        })}
                                  </p>
                                )}
                              </div>
                              <span className={styles.weekHours}>
                                <strong>{week.hours.toFixed(2)}h</strong>
                              </span>
                            </div>
                            <span
                              className={`${styles.weekChevron} ${isOpen ? styles.weekChevronOpen : ""}`}
                              aria-hidden="true"
                            >
                              ▼
                            </span>
                          </div>
                          <div
                            id={`week-${week.weekStart}`}
                            className={`${styles.weekContent} ${isOpen ? styles.weekContentOpen : ""}`}
                          >
                            <div className={styles.weekContentInner}>
                              <div className={styles.entriesList}>
                                {week.entries.map((entry) => (
                                  <div key={entry.id} className={styles.entry}>
                                    <div className={styles.entryHeader}>
                                      <span className={styles.entryDate}>{entry.spent_date}</span>
                                      <span className={styles.entryHours}>{entry.hours}h</span>
                                    </div>
                                    <div className={styles.entryDetails}>
                                      {entry.project && (
                                        <span className={styles.entryProject}>{entry.project.name}</span>
                                      )}
                                      {entry.task && <span className={styles.entryTask}>{entry.task.name}</span>}
                                      {entry.client && <span className={styles.entryClient}>{entry.client.name}</span>}
                                    </div>
                                    {entry.notes && <p className={styles.entryNotes}>{entry.notes}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

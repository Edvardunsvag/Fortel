import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearHarvest, loadTokenFromStorage, selectIsHarvestAuthenticated, selectHarvestToken } from "../harvestSlice";
import { useHarvestUser, useHarvestTimeEntries, useAuthenticateHarvest, useTestHarvestApi } from "../queries";
import { checkLotteryEligibility } from "../lotteryUtils";
import { getHarvestAuthUrl, generateState } from "@/shared/config/harvestConfig";
import { routes } from "@/shared/routes";
import { useTranslation } from "react-i18next";
import styles from "./HarvestPage.module.scss";

export const HarvestPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector(selectHarvestToken);
  const isAuthenticated = useAppSelector(selectIsHarvestAuthenticated);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const hasAutoFetched = useRef(false);

  // TanStack Query hooks
  const authenticateMutation = useAuthenticateHarvest();
  const testApiMutation = useTestHarvestApi();
  const { data: user, isLoading: isLoadingUser, error: userError } = useHarvestUser(isAuthenticated);

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
  } = useHarvestTimeEntries(fromDate, toDate, isAuthenticated && !!fromDate && !!toDate);

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
      // Ensure we stay on Harvest tab by navigating to /harvest
      navigate(routes.harvest, { replace: true });
      // Clean up URL params
      window.history.replaceState({}, "", routes.harvest);
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
    dispatch(clearHarvest());
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

  // Group time entries by week
  const groupEntriesByWeek = () => {
    const weeks: { [key: string]: typeof timeEntries } = {};

    timeEntries.forEach((entry) => {
      // Parse the spent_date (YYYY-MM-DD format)
      const [year, month, day] = entry.spent_date.split("-").map(Number);
      const date = new Date(year, month - 1, day); // Use local date constructor to avoid timezone issues

      // Get the Monday of the week (ISO week starts on Monday)
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Days to subtract to get Monday
      const monday = new Date(date);
      monday.setDate(date.getDate() + diff);

      // Format as YYYY-MM-DD using local date components to avoid timezone conversion
      const mondayYear = monday.getFullYear();
      const mondayMonth = String(monday.getMonth() + 1).padStart(2, "0");
      const mondayDay = String(monday.getDate()).padStart(2, "0");
      const weekKey = `${mondayYear}-${mondayMonth}-${mondayDay}`;

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(entry);
    });

    // Sort weeks by date
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, entries]) => {
        // Parse weekStart (YYYY-MM-DD) as local date
        const [year, month, day] = weekStart.split("-").map(Number);
        const weekStartDate = new Date(year, month - 1, day);

        // Format dates as YYYY-MM-DD using local components
        const formatDate = (date: Date): string => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        // Calculate Friday of this week (Monday + 4 days) - this is the week end for lottery purposes
        const fridayDate = new Date(weekStartDate);
        fridayDate.setDate(weekStartDate.getDate() + 4);
        const fridayDateString = formatDate(fridayDate);

        const weekHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

        // Check lottery eligibility
        const lotteryCheck = checkLotteryEligibility(entries, fridayDateString);

        return {
          weekStart,
          weekEnd: fridayDateString, // Week end is Friday, not Saturday
          entries,
          hours: weekHours,
          isLotteryEligible: lotteryCheck.isEligible,
          lotteryReason: lotteryCheck.reason,
        };
      });
  };

  const weeklyData = groupEntriesByWeek();
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("harvest.title")}</h1>

        {!isAuthenticated ? (
          <div className={styles.loginForm}>
            <p className={styles.description}>{t("harvest.description")}</p>

            {error && <div className={styles.error}>{error}</div>}

            <button onClick={handleLogin} className={styles.button} disabled={isLoading} type="button">
              {isLoading ? t("harvest.connecting") : t("harvest.connect")}
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
              <h2>
                {t("harvest.welcome")}, {user?.first_name} {user?.last_name}!
              </h2>
              <p>
                <strong>{t("harvest.email")}:</strong> {user?.email}
              </p>
              <p>
                <strong>{t("harvest.userId")}:</strong> {user?.id}
              </p>
              <button onClick={handleLogout} className={styles.logoutButton} type="button">
                {t("harvest.disconnect")}
              </button>
            </div>

            <div className={styles.dataSection}>
              <h3>{t("harvest.fetchEntries")}</h3>

              <div className={styles.monthSelector}>
                <div className={styles.formGroup}>
                  <label htmlFor="selectedMonth" className={styles.label}>
                    {t("harvest.selectMonth")}
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
                {isLoading ? t("harvest.loading") : t("harvest.getEntries")}
              </button>

              {error && <div className={styles.error}>{error}</div>}

              {timeEntries.length > 0 && (
                <div className={styles.results}>
                  <h4>{t("harvest.results")}</h4>
                  <p className={styles.summary}>
                    {t("harvest.foundEntries", { count: timeEntries.length })}
                    {dateRange && (
                      <>
                        {" "}
                        {t("harvest.from")} {dateRange.from} {t("harvest.to")} {dateRange.to}
                      </>
                    )}
                    <br />
                    <strong>
                      {t("harvest.totalHours")}: {totalHours.toFixed(2)}
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
                                <h5 className={styles.weekTitle}>
                                  {t("harvest.week")}: {week.weekStart} - {week.weekEnd}
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

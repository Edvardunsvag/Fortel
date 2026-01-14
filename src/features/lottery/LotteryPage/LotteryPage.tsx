import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  clearLottery,
  loadTokenFromStorage,
  selectIsLotteryAuthenticated,
  selectLotteryToken,
  selectActiveLotterySubTab,
  LotterySubTab,
} from "../lotterySlice";
import { useLotteryUser, useLotteryTimeEntries, useAuthenticateLottery, useTestLotteryApi } from "../queries";
import { checkLotteryEligibility, getNextLotteryDate, getNextLotteryDateTime } from "../lotteryUtils";
import { getHarvestAuthUrl, generateState } from "@/shared/config/harvestConfig";
import { routes } from "@/shared/routes";
import { useTranslation } from "react-i18next";
import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays, format } from "date-fns";
import { formatDateReadable } from "@/shared/utils/dateUtils";
import { LotteryNavigationChips } from "./LotteryNavigationChips";
import { UserInfo } from "./UserInfo";
import styles from "./LotteryPage.module.scss";

export const LotteryPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector(selectLotteryToken);
  const isAuthenticated = useAppSelector(selectIsLotteryAuthenticated);
  const activeSubTab = useAppSelector(selectActiveLotterySubTab);

  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());

  // TanStack Query hooks
  const authenticateMutation = useAuthenticateLottery();
  const testApiMutation = useTestLotteryApi();
  const { data: user, isLoading: isLoadingUser, error: userError } = useLotteryUser(isAuthenticated);

  // Set date range to all of 2026
  const fromDate = "2026-01-01";
  const toDate = "2026-12-31";

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
  const nextLotteryDate = getNextLotteryDate();

  // Memoize the lottery date time to prevent infinite loops
  const nextLotteryDateTime = useMemo(() => getNextLotteryDateTime(), []);

  // Countdown state
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextLotteryDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextLotteryDateTime]);

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
            <LotteryNavigationChips />
            <UserInfo
              user={user}
              weeklyDataLength={weeklyData.length}
              totalLotteryTickets={totalLotteryTickets}
              onLogout={handleLogout}
            />
            {activeSubTab === LotterySubTab.TimeEntries && (
              <div className={styles.dataSection}>
                <h3>{t("lottery.fetchEntries")}</h3>
                {error && <div className={styles.error}>{error}</div>}
                {timeEntries.length > 0 && (
                  <div className={styles.results}>
                    <p className={styles.summary}>
                      {t("lottery.foundEntries", { count: timeEntries.length })} {t("lottery.from")} {fromDate}{" "}
                      {t("lottery.to")} {toDate}
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
                                            timestamp: formatDateReadable(week.lotteryReasonData.latestUpdate, true),
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
                                        {entry.client && (
                                          <span className={styles.entryClient}>{entry.client.name}</span>
                                        )}
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
            )}

            {activeSubTab === LotterySubTab.Rules && (
              <div className={styles.dataSection}>
                <h3>{t("lottery.rules.title")}</h3>
                <div className={styles.rulesContent}>
                  <h4>{t("lottery.rules.eligibility")}</h4>
                  <ul>
                    <li>{t("lottery.rules.rule1")}</li>
                    <li>{t("lottery.rules.rule2")}</li>
                  </ul>
                  <h4>{t("lottery.rules.monthChange")}</h4>
                  <ul>
                    <li>{t("lottery.rules.rule3")}</li>
                  </ul>
                  <h4>{t("lottery.rules.howItWorks")}</h4>
                  <p>{t("lottery.rules.description")}</p>
                </div>
              </div>
            )}

            {activeSubTab === LotterySubTab.Lottery && (
              <div className={styles.dataSection}>
                <h3>{t("lottery.lottery.title")}</h3>
                <div className={styles.lotteryContent}>
                  <div className={styles.totalTicketsBadge}>
                    <span className={styles.totalTicketsText}>
                      {t("lottery.lottery.totalTickets", { count: totalLotteryTickets })}
                    </span>
                    <span className={styles.ticketIconLarge}>🎫</span>
                  </div>

                  <div className={styles.nextLottery}>
                    <h4>{t("lottery.lottery.nextLottery")}</h4>
                    <p>
                      {t("lottery.lottery.nextLotteryDate", {
                        date: formatDateReadable(nextLotteryDate, false),
                      })}
                    </p>
                    {timeRemaining && (
                      <div className={styles.countdown}>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>{timeRemaining.days}</span>
                          <span className={styles.countdownLabel}>
                            {t("lottery.lottery.countdown.days", { count: timeRemaining.days })}
                          </span>
                        </div>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>{String(timeRemaining.hours).padStart(2, "0")}</span>
                          <span className={styles.countdownLabel}>
                            {t("lottery.lottery.countdown.hours", { count: timeRemaining.hours })}
                          </span>
                        </div>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>
                            {String(timeRemaining.minutes).padStart(2, "0")}
                          </span>
                          <span className={styles.countdownLabel}>
                            {t("lottery.lottery.countdown.minutes", { count: timeRemaining.minutes })}
                          </span>
                        </div>
                        <div className={styles.countdownItem}>
                          <span className={styles.countdownValue}>
                            {String(timeRemaining.seconds).padStart(2, "0")}
                          </span>
                          <span className={styles.countdownLabel}>
                            {t("lottery.lottery.countdown.seconds", { count: timeRemaining.seconds })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {weeklyData.length > 0 && (
                    <div className={styles.eligibleWeeks}>
                      <h4>{t("lottery.lottery.eligibleWeeks")}</h4>
                      <ul>
                        {weeklyData
                          .filter((week) => week.isLotteryEligible)
                          .map((week) => (
                            <li key={week.weekStart}>
                              {t("lottery.week")}: {week.weekStart} - {week.weekEnd} ({week.hours.toFixed(2)}h)
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

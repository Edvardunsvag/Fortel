import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLotteryTimeEntries, useLotteryUser, useSyncLotteryTickets } from "../queries";
import { useGroupEntriesByWeek } from "../useGroupEntriesByWeek";
import { getNextLotteryDate, getNextLotteryDateTime } from "../lotteryUtils";
import { formatDateReadable } from "@/shared/utils/dateUtils";
import { WinnersReveal } from "./WinnersReveal";
import styles from "./Lotteri.module.scss";
import { FROM_DATE, TO_DATE } from "../consts";

interface LotteriProps {
  isAuthenticated: boolean;
}

export const Lotteri = ({ isAuthenticated }: LotteriProps) => {
  const { t } = useTranslation();

  const { data: timeEntries = [] } = useLotteryTimeEntries(
    FROM_DATE,
    TO_DATE,
    isAuthenticated && !!FROM_DATE && !!TO_DATE
  );

  const { data: user } = useLotteryUser(isAuthenticated);

  // Group time entries by week using the shared hook
  const weeklyData = useGroupEntriesByWeek(timeEntries);
  const totalLotteryTickets = weeklyData.filter((week) => week.isLotteryEligible).length;
  const eligibleWeeks = weeklyData.filter((week) => week.isLotteryEligible).map((week) => week.weekKey);
  const nextLotteryDate = getNextLotteryDate();

  const syncTicketsMutation = useSyncLotteryTickets();

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

  const handleSyncTickets = async () => {
    if (!user || eligibleWeeks.length === 0) {
      return;
    }

    const userName = `${user.first_name} ${user.last_name}`.trim();
    const userId = user.id.toString();

    try {
      await syncTicketsMutation.mutateAsync({
        userId,
        name: userName,
        image: null, // Harvest API doesn't provide user image
        eligibleWeeks,
      });
    } catch (error) {
      // Error is handled by the mutation
      console.error("Failed to sync lottery tickets:", error);
    }
  };

  const handleSyncKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSyncTickets();
    }
  };

  return (
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
                <span className={styles.countdownValue}>{String(timeRemaining.minutes).padStart(2, "0")}</span>
                <span className={styles.countdownLabel}>
                  {t("lottery.lottery.countdown.minutes", { count: timeRemaining.minutes })}
                </span>
              </div>
              <div className={styles.countdownItem}>
                <span className={styles.countdownValue}>{String(timeRemaining.seconds).padStart(2, "0")}</span>
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

        {eligibleWeeks.length > 0 && user && (
          <div className={styles.syncSection}>
            <button
              type="button"
              onClick={handleSyncTickets}
              onKeyDown={handleSyncKeyDown}
              disabled={syncTicketsMutation.isPending}
              className={styles.syncButton}
              aria-label={t("lottery.lottery.syncTickets")}
            >
              {syncTicketsMutation.isPending
                ? t("lottery.lottery.syncing")
                : t("lottery.lottery.syncTickets")}
            </button>
            {syncTicketsMutation.isError && (
              <p className={styles.error} role="alert">
                {syncTicketsMutation.error instanceof Error
                  ? syncTicketsMutation.error.message
                  : t("lottery.lottery.syncError")}
              </p>
            )}
            {syncTicketsMutation.isSuccess && syncTicketsMutation.data && (
              <p className={styles.success} role="status">
                {t("lottery.lottery.syncSuccess", {
                  synced: syncTicketsMutation.data.syncedCount,
                  skipped: syncTicketsMutation.data.skippedCount,
                })}
              </p>
            )}
          </div>
        )}

        <WinnersReveal />
      </div>
    </div>
  );
};

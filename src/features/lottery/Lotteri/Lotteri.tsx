import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useLotteryTimeEntries, useLotteryUser, useSyncLotteryTickets, useLotteryTickets, useAllWinners, lotteryKeys } from "../queries";
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
  const eligibleWeeks = weeklyData.filter((week) => week.isLotteryEligible).map((week) => week.weekKey);
  const nextLotteryDate = getNextLotteryDate();

  const syncTicketsMutation = useSyncLotteryTickets();
  const queryClient = useQueryClient();
  const hasSyncedRef = useRef(false);
  const isAutoSyncingRef = useRef(false);

  // Get synced tickets count
  const userId = user?.id.toString() || null;
  const { data: syncedTickets = [] } = useLotteryTickets(
    userId,
    isAuthenticated && !!userId
  );
  const syncedTicketsCount = syncedTickets.length;

  // Check for winners
  const { data: winnersData } = useAllWinners();
  const hasWinners = (winnersData?.weeklyWinners || []).length > 0;

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

  // Auto-sync tickets on mount when user and eligibleWeeks are available
  useEffect(() => {
    const autoSync = async () => {
      if (!user || eligibleWeeks.length === 0 || hasSyncedRef.current || syncTicketsMutation.isPending) {
        return;
      }

      const userName = `${user.first_name} ${user.last_name}`.trim();
      const userIdStr = user.id.toString();

      try {
        hasSyncedRef.current = true;
        isAutoSyncingRef.current = true;
        await syncTicketsMutation.mutateAsync({
          userId: userIdStr,
          name: userName,
          image: null, // Harvest API doesn't provide user image
          eligibleWeeks,
        });
        // Invalidate tickets query to refetch updated count
        queryClient.invalidateQueries({ queryKey: lotteryKeys.tickets(userIdStr) });
      } catch (error) {
        // Error is handled by the mutation
        console.error("Failed to sync lottery tickets:", error);
        hasSyncedRef.current = false; // Allow retry on error
      } finally {
        isAutoSyncingRef.current = false;
      }
    };

    autoSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, eligibleWeeks.length]);

  const handleSyncTickets = async () => {
    if (!user || eligibleWeeks.length === 0) {
      return;
    }

    const userName = `${user.first_name} ${user.last_name}`.trim();
    const userIdStr = user.id.toString();

    try {
      isAutoSyncingRef.current = false; // Mark as manual sync
      await syncTicketsMutation.mutateAsync({
        userId: userIdStr,
        name: userName,
        image: null, // Harvest API doesn't provide user image
        eligibleWeeks,
      });
      // Invalidate tickets query to refetch updated count
      queryClient.invalidateQueries({ queryKey: lotteryKeys.tickets(userIdStr) });
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
        {/* Show winners at the top if they exist */}
        {hasWinners && <WinnersReveal />}

        <div className={styles.totalTicketsBadge}>
          <span className={styles.totalTicketsText}>
            {t("lottery.lottery.totalTickets", { count: syncedTicketsCount })}
          </span>
          <span className={styles.ticketIconLarge}>🎫</span>
        </div>

        {/* Show sync status only if there's an error or manual sync was just performed */}
        {eligibleWeeks.length > 0 && user && (
          <div className={styles.syncSection}>
            {syncTicketsMutation.isError ? (
              <div className={styles.syncStatus}>
                <p className={styles.error} role="alert">
                  {syncTicketsMutation.error instanceof Error
                    ? syncTicketsMutation.error.message
                    : t("lottery.lottery.syncError")}
                </p>
                <button
                  type="button"
                  onClick={handleSyncTickets}
                  onKeyDown={handleSyncKeyDown}
                  className={styles.syncButton}
                  aria-label={t("lottery.lottery.syncTickets")}
                >
                  {t("lottery.lottery.syncTickets")}
                </button>
              </div>
            ) : syncTicketsMutation.isSuccess && syncTicketsMutation.data && !isAutoSyncingRef.current ? (
              <div className={styles.syncStatus}>
                <p className={styles.success} role="status">
                  {t("lottery.lottery.syncSuccess", {
                    synced: syncTicketsMutation.data.syncedCount,
                    skipped: syncTicketsMutation.data.skippedCount,
                  })}
                </p>
              </div>
            ) : null}
          </div>
        )}

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

        {/* Show winners at the bottom if they don't exist (for the reveal button) */}
        {!hasWinners && <WinnersReveal />}
      </div>
    </div>
  );
};

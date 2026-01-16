import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAllWinners, useLotteryUser } from "../queries";
import { getNextFridayAt15 } from "../lotteryUtils";
import { WinnersReveal } from "./WinnersReveal";
import styles from "./Lotteri.module.scss";

export const Lotteri = () => {
  const { t } = useTranslation();

  // Fetch winners
  const { data: winnersData } = useAllWinners();
  const { data: user } = useLotteryUser(true);
  const userId = user?.id.toString() || null;

  // Check if there are winners
  const hasWinners = (winnersData?.weeklyWinners || []).length > 0;

  // Check if the logged-in user is a winner
  const isUserWinner = useMemo(() => {
    if (!userId || !winnersData?.weeklyWinners) return false;
    return winnersData.weeklyWinners.some((weekGroup) => weekGroup.winners.some((winner) => winner.userId === userId));
  }, [userId, winnersData]);

  // Memoize target date to prevent infinite loops in useEffect
  const targetDateTime = useMemo(() => getNextFridayAt15(), []);

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
      const diff = targetDateTime.getTime() - now.getTime();

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
  }, [targetDateTime]);

  return (
    <div className={styles.dataSection}>
      <h3>{t("lottery.lottery.title")}</h3>
      <div className={styles.lotteryContent}>
        {/* Show winners if they exist, otherwise show countdown */}
        {hasWinners ? (
          <WinnersReveal isUserWinner={isUserWinner} />
        ) : (
          timeRemaining && (
            <div className={styles.nextLottery}>
              <div className={styles.lockedCountdown}>
                <div className={styles.lockedTimeUnit}>
                  <span className={styles.lockedValue}>{timeRemaining.days}</span>
                  <span className={styles.lockedLabel}>{t("lottery.luckyWheel.days", "dager")}</span>
                </div>
                <div className={styles.lockedTimeUnit}>
                  <span className={styles.lockedValue}>{String(timeRemaining.hours).padStart(2, "0")}</span>
                  <span className={styles.lockedLabel}>{t("lottery.luckyWheel.hours", "timer")}</span>
                </div>
                <div className={styles.lockedTimeUnit}>
                  <span className={styles.lockedValue}>{String(timeRemaining.minutes).padStart(2, "0")}</span>
                  <span className={styles.lockedLabel}>{t("lottery.luckyWheel.minutes", "min")}</span>
                </div>
                <div className={styles.lockedTimeUnit}>
                  <span className={styles.lockedValue}>{String(timeRemaining.seconds).padStart(2, "0")}</span>
                  <span className={styles.lockedLabel}>{t("lottery.luckyWheel.seconds", "sek")}</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

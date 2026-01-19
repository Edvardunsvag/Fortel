import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { FortedleServerModelsDTOsEmployeeWeekDto } from "@/shared/api/generated/index";
import styles from "./Lotteri.module.scss";

interface WeekDetailsProps {
  week: FortedleServerModelsDTOsEmployeeWeekDto;
}

export const WeekDetails = ({ week }: WeekDetailsProps) => {
  const { t } = useTranslation();

  // Memoize countdown target to prevent infinite re-renders
  const countdownTarget = useMemo(() => {
    return week.countdownTarget ? new Date(week.countdownTarget) : null;
  }, [week.countdownTarget]);

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!countdownTarget || week.winnerDrawn) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = countdownTarget.getTime() - now.getTime();

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
  }, [countdownTarget, week.winnerDrawn]);

  return (
    <div className={styles.weekDetails}>
      <div className={styles.weekDetailsSection}>
        <h4 className={styles.weekDetailsTitle}>{t("lottery.weekDetails.lotteryStatus")}</h4>
        <div className={styles.weekDetailsStatus}>
          {week.isLotteryEligible ? (
            <div className={styles.statusBadge + " " + styles.statusEligible}>
              <span className={styles.statusIcon}>✓</span>
              <span>{t("lottery.weekDetails.eligible")}</span>
            </div>
          ) : (
            <div className={styles.statusBadge + " " + styles.statusNotEligible}>
              <span className={styles.statusIcon}>✗</span>
              <span>{t("lottery.weekDetails.notEligible")}</span>
            </div>
          )}

          {week.hasTicket && (
            <div className={styles.statusBadge + " " + styles.statusTicket}>
              <span className={styles.statusIcon}>🎫</span>
              <span>{t("lottery.weekDetails.hasTicket")}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.weekDetailsSection}>
        <h4 className={styles.weekDetailsTitle}>{t("lottery.weekDetails.winnerStatus")}</h4>
        {week.winnerDrawn ? (
          <div className={styles.winnerSection}>
            {week.hasWon ? (
              <div className={styles.winnerMessage + " " + styles.winnerMessageSuccess}>
                <p className={styles.winnerText}>{t("lottery.weekDetails.youWon")}</p>
                {week.winner && (
                  <div className={styles.winnerInfo}>
                    {week.winner.image ? (
                      <img src={week.winner.image} alt={week.winner.name ?? ""} className={styles.winnerAvatar} />
                    ) : (
                      <div className={styles.winnerAvatarPlaceholder}>{week.winner.name ?? ""}</div>
                    )}
                    <span className={styles.winnerName}>{week.winner.name ?? ""}</span>
                  </div>
                )}
              </div>
            ) : week.winner ? (
              <div className={styles.winnerMessage}>
                <p className={styles.winnerLabel}>{t("lottery.weekDetails.winner")}</p>
                <div className={styles.winnerInfo}>
                  {week.winner.image ? (
                    <img src={week.winner.image} alt={week.winner.name ?? ""} className={styles.winnerAvatar} />
                  ) : (
                    <div className={styles.winnerAvatarPlaceholder}>{week.winner.name ?? ""}</div>
                  )}
                  <span className={styles.winnerName}>{week.winner.name ?? ""}</span>
                </div>
              </div>
            ) : (
              <p className={styles.winnerText}>{t("lottery.weekDetails.noWinner")}</p>
            )}
          </div>
        ) : (
          <div className={styles.countdownSection}>
            {timeRemaining ? (
              <div className={styles.countdown}>
                <p className={styles.countdownLabel}>{t("lottery.weekDetails.countdownLabel")}</p>
                <div className={styles.countdownUnits}>
                  <div className={styles.countdownUnit}>
                    <span className={styles.countdownValue}>{timeRemaining.days}</span>
                    <span className={styles.countdownLabel}>{t("lottery.luckyWheel.days", "dager")}</span>
                  </div>
                  <div className={styles.countdownUnit}>
                    <span className={styles.countdownValue}>{String(timeRemaining.hours).padStart(2, "0")}</span>
                    <span className={styles.countdownLabel}>{t("lottery.luckyWheel.hours", "timer")}</span>
                  </div>
                  <div className={styles.countdownUnit}>
                    <span className={styles.countdownValue}>{String(timeRemaining.minutes).padStart(2, "0")}</span>
                    <span className={styles.countdownLabel}>{t("lottery.luckyWheel.minutes", "min")}</span>
                  </div>
                  <div className={styles.countdownUnit}>
                    <span className={styles.countdownValue}>{String(timeRemaining.seconds).padStart(2, "0")}</span>
                    <span className={styles.countdownLabel}>{t("lottery.luckyWheel.seconds", "sek")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.countdownText}>{t("lottery.weekDetails.waitingForDraw")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import { useTranslation } from "react-i18next";
import type { FortedleServerModelsDTOsEmployeeWeekDto } from "@/shared/api/generated/index";
import { useCountdown } from "../hooks/useCountdown";
import { getInitials } from "@/shared/utils/nameMatcher";
import { useClaimWeeklyPrize } from "../queries";
import styles from "./Lotteri.module.scss";

interface WeekDetailsProps {
  week: FortedleServerModelsDTOsEmployeeWeekDto;
}

export const WeekDetails = ({ week }: WeekDetailsProps) => {
  const { t } = useTranslation();
  const timeRemaining = useCountdown(week.countdownTarget, !week.winnerDrawn);
  const claimPrizeMutation = useClaimWeeklyPrize();

  const handleClaimPrize = () => {
    if (week.winner?.winningTicketId) {
      claimPrizeMutation.mutate({ winningTicketId: week.winner.winningTicketId });
    }
  };

  const handleClaimPrizeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClaimPrize();
    }
  };

  const canClaimPrize = week.hasWon && week.winnerDrawn && week.winner && !week.winner.prizeClaimed && week.winner.winningTicketId;
  const isClaiming = claimPrizeMutation.isPending;
  const prizeClaimed = week.winner?.prizeClaimed === true;

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
              <div className={`${styles.winnerMessage} ${styles.winnerMessageSuccess} ${styles.winnerMessageFestive}`}>
                <p className={styles.winnerText}>
                  🎉 {t("lottery.weekDetails.youWon")} 🎉
                </p>
                <p className={styles.winnerSubtext}>Gratulerer med seieren! 🏆✨</p>
                {week.winner && (
                  <div className={styles.winnerInfo}>
                    {week.winner.image ? (
                      <img src={week.winner.image} alt={week.winner.name ?? ""} className={styles.winnerAvatar} />
                    ) : (
                      <div className={styles.winnerAvatarPlaceholder}>{getInitials(week.winner.name ?? "")}</div>
                    )}
                    <span className={styles.winnerName}>{week.winner.name ?? ""}</span>
                  </div>
                )}
                {canClaimPrize && (
                  <button
                    className={styles.claimPrizeButton}
                    onClick={handleClaimPrize}
                    onKeyDown={handleClaimPrizeKeyDown}
                    type="button"
                    disabled={isClaiming}
                    aria-label={isClaiming ? t("lottery.weekDetails.claimingPrize") : t("lottery.weekDetails.claimPrize")}
                  >
                    {isClaiming ? t("lottery.weekDetails.claimingPrize") : t("lottery.weekDetails.claimPrize")}
                  </button>
                )}
                {prizeClaimed && (
                  <p className={styles.prizeClaimedText}>{t("lottery.weekDetails.prizeClaimed")}</p>
                )}
                {claimPrizeMutation.isError && (
                  <p className={styles.prizeClaimError} role="alert">
                    {t("lottery.weekDetails.prizeClaimError")}
                  </p>
                )}
              </div>
            ) : week.winner ? (
              <div className={styles.winnerMessage}>
                <p className={styles.winnerLabel}>{t("lottery.weekDetails.winner")}</p>
                <div className={styles.winnerInfo}>
                  {week.winner.image ? (
                    <img src={week.winner.image} alt={week.winner.name ?? ""} className={styles.winnerAvatar} />
                  ) : (
                    <div className={styles.winnerAvatarPlaceholder}>{getInitials(week.winner.name ?? "")}</div>
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

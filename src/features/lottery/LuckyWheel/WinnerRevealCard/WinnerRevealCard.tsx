import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { MonthlyWinner } from "../../api";
import { triggerWinnerRevealConfetti } from "@/shared/animations/confettiVariants";
import styles from "./WinnerRevealCard.module.scss";

interface WinnerRevealCardProps {
  winner: MonthlyWinner;
  onClose: () => void;
  autoCloseDelay?: number;
}

const positionLabels: Record<number, { en: string; nb: string; emoji: string }> = {
  1: { en: "1st Place", nb: "1. plass", emoji: "🥇" },
  2: { en: "2nd Place", nb: "2. plass", emoji: "🥈" },
  3: { en: "3rd Place", nb: "3. plass", emoji: "🥉" },
};

export const WinnerRevealCard = ({
  winner,
  onClose,
  autoCloseDelay = 4000,
}: WinnerRevealCardProps) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Trigger confetti on mount
    triggerWinnerRevealConfetti();

    // Auto close after delay
    const timer = setTimeout(onClose, autoCloseDelay);
    return () => clearTimeout(timer);
  }, [onClose, autoCloseDelay]);

  const positionLabel = positionLabels[winner.position] || {
    en: `${winner.position}th Place`,
    nb: `${winner.position}. plass`,
    emoji: "🏆",
  };

  const displayLabel = i18n.language === "nb" ? positionLabel.nb : positionLabel.en;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.positionBadge}>
          <span className={styles.emoji}>{positionLabel.emoji}</span>
          <span className={styles.position}>{displayLabel}</span>
        </div>

        <div className={styles.announcement}>
          {t("lottery.luckyWheel.winnerReveal.andTheWinnerIs", "And the winner is...")}
        </div>

        <div className={styles.winnerInfo}>
          <div
            className={styles.avatarRing}
            style={{
              borderColor: winner.color || "#ffd700",
              boxShadow: `0 8px 24px ${winner.color || "#ffd700"}66, 0 0 40px ${winner.color || "#ffd700"}33`,
            }}
          >
            {winner.image ? (
              <img src={winner.image} alt={winner.name} className={styles.avatar} />
            ) : (
              <div
                className={styles.avatarPlaceholder}
                style={{ background: winner.color || "#ffd700" }}
              >
                {winner.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className={styles.name}>{winner.name}</h2>
          <p className={styles.tickets}>
            {t("lottery.luckyWheel.winnerReveal.withTickets", {
              count: winner.ticketsConsumed,
              defaultValue: "with {{count}} tickets",
            })}
          </p>
        </div>

        <button className={styles.continueButton} onClick={onClose}>
          {t("lottery.luckyWheel.winnerReveal.continue", "Continue")}
        </button>
      </div>
    </div>
  );
};

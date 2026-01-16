import { useTranslation } from "react-i18next";
import type { MonthlyWinner } from "../../api";
import styles from "./WinnersBoard.module.scss";

interface WinnersBoardProps {
  winners: MonthlyWinner[];
  month: string;
}

const positionEmoji: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export const WinnersBoard = ({ winners, month }: WinnersBoardProps) => {
  const { t, i18n } = useTranslation();

  // Format month for display
  const formatMonth = (monthStr: string) => {
    try {
      const [year, monthNum] = monthStr.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString(i18n.language === "nb" ? "nb-NO" : "en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return monthStr;
    }
  };

  if (winners.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>
          {t("lottery.luckyWheel.winners.title", "Winners")}
        </h3>
        <p className={styles.empty}>
          {t("lottery.luckyWheel.winners.notYetDrawn", "Winners not yet drawn")}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {t("lottery.luckyWheel.winners.title", "Winners")}
      </h3>
      <p className={styles.month}>{formatMonth(month)}</p>

      <div className={styles.winnersList}>
        {winners.map((winner) => (
          <div
            key={`${winner.userId}-${winner.position}`}
            className={styles.winner}
          >
            <div className={styles.position}>
              <span className={styles.emoji}>
                {positionEmoji[winner.position] || "🏆"}
              </span>
            </div>
            <div className={styles.info}>
              {winner.image ? (
                <img
                  src={winner.image}
                  alt={winner.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {winner.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.details}>
                <span className={styles.name}>{winner.name}</span>
                <span className={styles.tickets}>
                  {t("lottery.luckyWheel.winners.tickets", {
                    count: winner.ticketsConsumed,
                    defaultValue: "{{count}} tickets",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

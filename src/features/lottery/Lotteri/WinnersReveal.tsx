import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAllWinners } from "../queries";
import styles from "./Lotteri.module.scss";

export const WinnersReveal = () => {
  const { t } = useTranslation();
  const [winnersRevealed, setWinnersRevealed] = useState(false);
  const { data: winnersData, isLoading, error } = useAllWinners();

  const handleRevealWinners = () => {
    setWinnersRevealed(true);
  };

  const handleRevealKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRevealWinners();
    }
  };

  const weeklyWinners = winnersData?.weeklyWinners || [];

  return (
    <div className={styles.winnersRevealWrapper}>
      {!winnersRevealed && (
        <button
          className={styles.revealWinnersButton}
          onClick={handleRevealWinners}
          onKeyDown={handleRevealKeyDown}
          type="button"
          aria-label={t("lottery.lottery.revealWinners")}
        >
          {t("lottery.lottery.revealWinners")}
        </button>
      )}
      <div className={`${styles.winnersContainer} ${!winnersRevealed ? styles.blurred : ""}`}>
        {isLoading ? (
          <p className={styles.winnersText}>{t("lottery.loading")}</p>
        ) : error ? (
          <p className={styles.winnersText} role="alert">
            {error instanceof Error ? error.message : t("lottery.lottery.winners.error")}
          </p>
        ) : weeklyWinners.length === 0 ? (
          <p className={styles.winnersText}>{t("lottery.lottery.winners.noWinners")}</p>
        ) : (
          <>
            <h3 className={styles.winnersTitle}>{t("lottery.lottery.winners.title")}</h3>
            {weeklyWinners.map((weekGroup) => (
              <div key={weekGroup.week} className={styles.weekGroup}>
                <h4 className={styles.weekLabel}>
                  {t("lottery.lottery.winners.week")}: {weekGroup.week}
                </h4>
                <div className={styles.winnersList}>
                  {weekGroup.winners.map((winner, index) => {
                    const shouldShowPlaceholder = !winner.image || winner.image.toLowerCase().includes("imagekit");
                    return (
                      <div key={`${winner.userId}-${index}`} className={styles.winnerItem}>
                        {shouldShowPlaceholder ? (
                          <div className={styles.winnerAvatarPlaceholder}>{winner.name}</div>
                        ) : (
                          <img src={winner.image || ""} alt={winner.name} className={styles.winnerAvatar} />
                        )}
                        <span className={styles.winnerName}>{winner.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

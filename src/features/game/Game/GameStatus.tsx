import { useTranslation } from "react-i18next";
import type { GameState } from "@/features/game/types";
import styles from "./GameStatus.module.scss";

interface GameStatusProps {
  status: GameState["status"];
  guesses: GameState["guesses"];
  visible?: boolean;
}

export const GameStatus = ({ status, guesses, visible = true }: GameStatusProps) => {
  const { t } = useTranslation();

  if (status === "won") {
    return (
      <div
        className={`${styles.status} ${styles.won} ${visible ? styles.visible : styles.hidden}`}
        role="status"
        aria-live="polite"
      >
        <div className={styles.content}>
          <div className={styles.emoji}>🎉</div>
          <h2>{t("gameStatus.congratulations")}</h2>
          <p>{t("gameStatus.guessedCorrectly", { count: guesses.length })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.status} role="status">
      <p className={styles.guessCount}>
        {t("game.guesses")}: <strong>{guesses.length}</strong>
      </p>
    </div>
  );
};

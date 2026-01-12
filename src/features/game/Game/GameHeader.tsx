import { useAppSelector } from "@/app/hooks";
import { selectAccount } from "@/features/auth/authSlice";
import { selectGameStatus, selectTotalGuesses } from "@/features/game/gameSlice";
import { useTranslation } from "react-i18next";
import styles from "./Game.module.scss";

export const GameHeader = () => {
  const { t } = useTranslation();
  const gameStatus = useAppSelector(selectGameStatus);
  const totalGuesses = useAppSelector(selectTotalGuesses);
  const account = useAppSelector(selectAccount);

  return (
    <>
      <h1 className={styles.title}>{t("game.title")}</h1>
      <div className={styles.headerInfo}>
        <p className={styles.subtitle}>
          {t("game.subtitle")} {account?.name}!
        </p>
        {gameStatus === "playing" && (
          <div className={styles.guessCountBadge}>
            {t("game.guesses")}: <strong>{totalGuesses}</strong>
          </div>
        )}
      </div>
    </>
  );
};

import { useAppSelector } from "@/app/hooks";
import { selectAccount } from "@/features/auth/authSlice";
import { selectEmployeeOfTheDayId, selectAttemptedByUserId } from "@/features/game/gameSlice";

import { useTranslation } from "react-i18next";
import styles from "./Game.module.scss";
import { Employee } from "../employees";

interface StartGameButtonProps {
  onStartGame: () => void;
  isStartingGame: boolean;
  employees: Employee[];
}

export const StartGameButton = ({ onStartGame, isStartingGame, employees }: StartGameButtonProps) => {
  const { t } = useTranslation();
  const employeeOfTheDayId = useAppSelector(selectEmployeeOfTheDayId);
  const attemptedByUserId = useAppSelector(selectAttemptedByUserId);
  const account = useAppSelector(selectAccount);
  const userId = account?.localAccountId || account?.username || null;

  // Show start button if game hasn't started yet
  if (!employeeOfTheDayId && userId && !attemptedByUserId) {
    return (
      <button
        className={styles.startButton}
        onClick={onStartGame}
        type="button"
        disabled={isStartingGame || employees.length === 0}
      >
        {isStartingGame ? t("game.startingGame") : t("game.startGame")}
      </button>
    );
  }

  return null;
};

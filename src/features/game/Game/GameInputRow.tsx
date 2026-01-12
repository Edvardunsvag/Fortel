import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { Employee } from "@/features/employees/types";
import {
  selectCanGuess,
  selectFunfactRevealed,
  selectGameStatus,
  selectGuesses,
  selectRoundId,
} from "@/features/game/gameSlice";
import { revealFunfact, loadRoundFromState } from "@/features/game/gameSlice";
import { useRevealFunfact } from "@/features/game/queries";
import { toRevealFunfactRequest } from "@/features/game/toDto";
import type { Guess } from "@/features/game/types";
import { useTranslation } from "react-i18next";
import { GuessInput } from "./GuessInput";
import styles from "./Game.module.scss";

interface GameInputRowProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onGuess: (employeeId: string) => void;
  employees: Employee[];
}

export const GameInputRow = ({ inputValue, onInputChange, onGuess, employees }: GameInputRowProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const canGuess = useAppSelector(selectCanGuess);
  const gameStatus = useAppSelector(selectGameStatus);
  const funfactRevealed = useAppSelector(selectFunfactRevealed);
  const guesses = useAppSelector(selectGuesses);
  const roundId = useAppSelector(selectRoundId);
  const revealFunfactMutation = useRevealFunfact();

  const handleRevealFunfact = () => {
    if (!roundId) {
      console.warn("Cannot reveal funfact: roundId is not available");
      return;
    }

    // Update local state
    dispatch(revealFunfact());

    // Save to server
    const request = toRevealFunfactRequest(roundId);
    revealFunfactMutation.mutate(request, {
      onSuccess: (round) => {
        dispatch(loadRoundFromState({ round }));
      },
      onError: (error) => {
        console.error("Failed to reveal funfact on server:", error);
      },
    });
  };

  if (!canGuess) {
    return null;
  }

  return (
    <div className={styles.inputRow}>
      <div className={styles.inputContainer}>
        <GuessInput
          value={inputValue}
          onChange={onInputChange}
          onGuess={onGuess}
          employees={employees}
          guessedEmployeeIds={guesses.map((guess: Guess) => guess.employeeId)}
        />
      </div>
      {gameStatus === "playing" && (
        <button className={styles.revealButton} onClick={handleRevealFunfact} type="button" disabled={funfactRevealed}>
          {t("game.buyInterests")}
        </button>
      )}
    </div>
  );
};

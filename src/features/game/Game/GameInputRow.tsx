import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { Employee } from "../employees";
import { selectCanGuess, selectGuesses } from "@/features/game/gameSlice";
import type { Guess } from "@/features/game/types";
import { GuessInput } from "./GuessInput";
import styles from "./Game.module.scss";

interface GameInputRowProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onGuess: (employeeId: string) => void;
  employees: Employee[];
}

export const GameInputRow = ({ inputValue, onInputChange, onGuess, employees }: GameInputRowProps) => {
  const canGuess = useAppSelector(selectCanGuess);
  const guesses = useAppSelector(selectGuesses);

  // Calculate first suggestion based on input value
  const firstSuggestion = useMemo(() => {
    if (!inputValue.trim()) {
      return null;
    }

    const guessedEmployeeIds = guesses.map((guess: Guess) => guess.employeeId);
    const searchTerm = inputValue.toLowerCase().trim();
    const filtered = employees.filter((emp) => {
      if (guessedEmployeeIds.includes(emp.id)) {
        return false;
      }
      const nameMatch = emp.name.toLowerCase().includes(searchTerm);
      const firstNameMatch = emp.firstName.toLowerCase().includes(searchTerm);
      const surnameMatch = emp.surname.toLowerCase().includes(searchTerm);
      return nameMatch || firstNameMatch || surnameMatch;
    });

    return filtered.length > 0 ? filtered[0] : null;
  }, [inputValue, employees, guesses]);

  const handleSubmitButtonClick = () => {
    if (firstSuggestion) {
      onGuess(firstSuggestion.id);
    }
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
      <button
        className={styles.submitButton}
        onClick={handleSubmitButtonClick}
        type="button"
        disabled={!firstSuggestion}
        aria-label="Submit guess"
      >
        <ArrowRight className={styles.arrowIcon} size={20} />
      </button>
    </div>
  );
};

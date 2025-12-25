import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loadEmployees, selectEmployees, selectEmployeesStatus } from '@/features/employees';
import {
  initializeGame,
  makeGuess,
  selectEmployeeOfTheDayId,
  selectGuesses,
  selectGameStatus,
  selectCanGuess,
} from '@/features/game';
import { getTodayDateString, getDateSeed, selectIndexBySeed } from '@/shared/utils/dateUtils';
import GuessInput from './GuessInput';
import GuessList from './GuessList';
import GameStatus from './GameStatus';
import ColorLegend from './ColorLegend';
import ShareResults from './ShareResults';
import styles from './Game.module.scss';

const Game = () => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const employeeOfTheDayId = useAppSelector(selectEmployeeOfTheDayId);
  const guesses = useAppSelector(selectGuesses);
  const gameStatus = useAppSelector(selectGameStatus);
  const canGuess = useAppSelector(selectCanGuess);

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (employeesStatus === 'idle') {
      dispatch(loadEmployees());
    }
  }, [dispatch, employeesStatus]);

  useEffect(() => {
    if (
      employeesStatus === 'succeeded' &&
      employees.length > 0 &&
      !employeeOfTheDayId
    ) {
      // Select a deterministic employee for the day based on the date
      // This ensures everyone gets the same employee on the same day
      const today = getTodayDateString();
      const seed = getDateSeed(today);
      const index = selectIndexBySeed(seed, employees.length);
      const selectedEmployee = employees[index];
      dispatch(initializeGame(selectedEmployee.id));
    }
  }, [dispatch, employeesStatus, employees, employeeOfTheDayId]);

  const handleGuess = (employeeName: string) => {
    if (!canGuess || !employeeOfTheDayId) {
      return;
    }

    const guessedEmployee = employees.find(
      (emp) => emp.name.toLowerCase() === employeeName.toLowerCase().trim()
    );

    if (!guessedEmployee) {
      return;
    }

    const targetEmployee = employees.find((emp) => emp.id === employeeOfTheDayId);

    if (!targetEmployee) {
      return;
    }

    dispatch(makeGuess({ guessed: guessedEmployee, target: targetEmployee }));
    setInputValue('');
  };

  if (employeesStatus === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading employees...</div>
      </div>
    );
  }

  if (employeesStatus === 'failed') {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Failed to load employees. Please refresh the page.
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No employees found.</div>
      </div>
    );
  }

  if (!employeeOfTheDayId) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Initializing game...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fortel</h1>
        <p className={styles.subtitle}>Guess the employee of the day!</p>
      </header>

      <GameStatus
        status={gameStatus}
        guesses={guesses}
      />

      {gameStatus === 'playing' && (
        <GuessInput
          value={inputValue}
          onChange={setInputValue}
          onGuess={handleGuess}
          employees={employees}
          disabled={!canGuess}
        />
      )}

      <GuessList guesses={guesses} />

      {(gameStatus === 'won' || gameStatus === 'lost') && (
        <ShareResults guesses={guesses.length} isWon={gameStatus === 'won'} />
      )}

      <ColorLegend />
    </div>
  );
};

export default Game;


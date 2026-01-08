import { useTranslation } from 'react-i18next';
import type { Guess } from '@/features/game/types';
import { EmployeeCell } from './EmployeeCell/EmployeeCell';
import { HintCell } from './HintCell/HintCell';
import { useGuessAnimation } from './useGuessAnimation';
import { TABLE_COLUMNS } from './utils';
import styles from './GuessList.module.scss';

interface GuessListProps {
  guesses: Guess[];
}

export const GuessList = ({ guesses }: GuessListProps) => {
  const { t } = useTranslation();
  const animatedGuesses = useGuessAnimation(guesses);

  if (guesses.length === 0) {
    return null;
  }

  const reversedGuesses = [...guesses].reverse();
  
  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.guessTable}>
          <thead>
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th key={column.key} className={styles.headerCell}>
                  {t(`guessList.${column.key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reversedGuesses.map((guess, visualIndex) => {
              // Calculate original index (latest guess has highest original index)
              const originalIndex = guesses.length - 1 - visualIndex;
              const isAnimated = animatedGuesses.has(originalIndex);

              return (
                <tr key={`${guess.employeeId}-${originalIndex}`} className={styles.guessRow}>
                  <EmployeeCell guess={guess} />
                  {TABLE_COLUMNS.slice(1).map((column, columnIndex) => {
                    if (!column.hintType) return null;
                    return (
                      <HintCell
                        key={column.key}
                        guess={guess}
                        hintType={column.hintType}
                        guessIndex={visualIndex}
                        boxIndex={columnIndex}
                        isAnimated={isAnimated}
                        t={t}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


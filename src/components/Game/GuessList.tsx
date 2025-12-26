import { useEffect, useState, useRef } from 'react';
import type { Guess } from '@/features/game';
import { HintType, HintResult } from '@/features/game';
import { FlipBox } from './FlipBox';
import styles from './GuessList.module.scss';

interface GuessListProps {
  guesses: Guess[];
}

export const GuessList = ({ guesses }: GuessListProps) => {
  const [animatedGuesses, setAnimatedGuesses] = useState<Set<number>>(new Set());
  const previousLengthRef = useRef<number>(0);

  useEffect(() => {
    // Only trigger animation when a new guess is added (length increases)
    if (guesses.length > previousLengthRef.current) {
      const lastIndex = guesses.length - 1;
      // Trigger animation for the new guess after a short delay
      setTimeout(() => {
        setAnimatedGuesses(new Set([lastIndex]));
      }, 100);
    }
    previousLengthRef.current = guesses.length;
  }, [guesses.length]);

  if (guesses.length === 0) {
    return null;
  }

  const getHintValue = (guess: Guess, hintType: HintType): string => {
    const hint = guess.hints.find((h) => h.type === hintType);
    return hint?.message || '';
  };

  const getHintResult = (guess: Guess, hintType: HintType): HintResult => {
    const hint = guess.hints.find((h) => h.type === hintType);
    return hint?.result || HintResult.Incorrect;
  };

  const getHintArrow = (guess: Guess, hintType: HintType) => {
    const hint = guess.hints.find((h) => h.type === hintType);
    if (hint?.result === HintResult.Higher) {
      return { show: true, direction: 'down' as const };
    }
    if (hint?.result === HintResult.Lower) {
      return { show: true, direction: 'up' as const };
    }
    return { show: false, direction: 'up' as const };
  };


  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.guessTable}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Employee</th>
              <th className={styles.headerCell}>Department</th>
              <th className={styles.headerCell}>Office</th>
              <th className={styles.headerCell}>Teams</th>
              <th className={styles.headerCell}>Age</th>
              <th className={styles.headerCell}>Supervisor</th>
            </tr>
          </thead>
          <tbody>
            {guesses.map((guess, guessIndex) => {
              const isAnimated = animatedGuesses.has(guessIndex);
              const baseDelay = 400; // Base delay in ms
              const delayPerBox = 400; // Delay between each box

              return (
                <tr key={`${guess.employeeId}-${guessIndex}`} className={styles.guessRow}>
                  <td className={styles.employeeCell}>
                    <div className={styles.employeeName}>
                      {guess.avatarImageUrl ? (
                        <img
                          src={guess.avatarImageUrl}
                          alt={guess.employeeName}
                          className={styles.avatarImage}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{guess.employeeName}</div>
                      )}
                    </div>
                    {guess.isCorrect && (
                      <div className={styles.correctBadge} aria-label="Correct guess">
                        ✓
                      </div>
                    )}
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label="Department"
                      value={getHintValue(guess, HintType.Department)}
                      result={getHintResult(guess, HintType.Department)}
                      delay={isAnimated ? baseDelay + delayPerBox * 0 : -1}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label="Office"
                      value={getHintValue(guess, HintType.Office)}
                      result={getHintResult(guess, HintType.Office)}
                      delay={isAnimated ? baseDelay + delayPerBox * 1 : -1}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label="Teams"
                      value={getHintValue(guess, HintType.Teams)}
                      result={getHintResult(guess, HintType.Teams)}
                      delay={isAnimated ? baseDelay + delayPerBox * 2 : -1}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label="Age"
                      value={getHintValue(guess, HintType.Age)}
                      result={getHintResult(guess, HintType.Age)}
                      delay={isAnimated ? baseDelay + delayPerBox * 3 : -1}
                      showArrow={getHintArrow(guess, HintType.Age).show}
                      arrowDirection={getHintArrow(guess, HintType.Age).direction}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label="Supervisor"
                      value={getHintValue(guess, HintType.Supervisor)}
                      result={getHintResult(guess, HintType.Supervisor)}
                      delay={isAnimated ? baseDelay + delayPerBox * 4 : -1}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

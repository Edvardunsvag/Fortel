import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Guess, GuessHint } from '@/features/game/types';
import { HintType, HintResult } from '@/features/game/types';
import { FlipBox } from './FlipBox';
import styles from './GuessList.module.scss';

interface GuessListProps {
  guesses: Guess[];
}

export const GuessList = ({ guesses }: GuessListProps) => {
  const { t } = useTranslation();
  const [animatedGuesses, setAnimatedGuesses] = useState<Set<number>>(new Set());
  const previousLengthRef = useRef<number>(0);
  const initialLengthRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize on mount - if there are existing guesses, mark them as pre-existing
    if (!isInitializedRef.current) {
      if (guesses.length > 0) {
        // Mark all existing guesses as animated (they will flip with staggered delays)
        setAnimatedGuesses(new Set(guesses.map((_, index) => index)));
        initialLengthRef.current = guesses.length;
      } else {
        // No existing guesses, so initialLengthRef stays 0
        initialLengthRef.current = 0;
      }
      previousLengthRef.current = guesses.length;
      isInitializedRef.current = true;
      return;
    }
    
    // Handle case where guesses are loaded from server after initial mount (page refresh)
    // If guesses go from 0 to multiple, treat them all as pre-existing and animate them
    if (previousLengthRef.current === 0 && guesses.length > 0) {
      // All guesses are newly loaded from server - mark them all as animated with staggered delays
      setAnimatedGuesses(new Set(guesses.map((_, index) => index)));
      initialLengthRef.current = guesses.length;
      previousLengthRef.current = guesses.length;
      return;
    }
    
    // Only trigger animation when a new guess is added (length increases)
    if (guesses.length > previousLengthRef.current) {
      const lastIndex = guesses.length - 1;
      // Trigger animation for the new guess after a short delay
      setTimeout(() => {
        setAnimatedGuesses((prev) => new Set([...prev, lastIndex]));
      }, 100);
    }
    previousLengthRef.current = guesses.length;
  }, [guesses.length]);

  if (guesses.length === 0) {
    return null;
  }

  const getHintValue = (guess: Guess, hintType: HintType): string => {
    const hint = guess.hints.find((h: GuessHint) => h.type === hintType);
    return hint?.message || '';
  };

  const getHintResult = (guess: Guess, hintType: HintType): HintResult => {
    const hint = guess.hints.find((h: GuessHint) => h.type === hintType);
    return hint?.result || HintResult.Incorrect;
  };

  const getHintArrow = (guess: Guess, hintType: HintType) => {
    const hint = guess.hints.find((h: GuessHint) => h.type === hintType);
    if (hint?.result === HintResult.Higher) {
      return { show: true, direction: 'down' as const };
    }
    if (hint?.result === HintResult.Lower) {
      return { show: true, direction: 'up' as const };
    }
    return { show: false, direction: 'up' as const };
  };


  // Show all hints (Classic mode)
  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.guessTable}>
          <thead>
            <tr>
              <th className={styles.headerCell}>{t('guessList.employee')}</th>
              <th className={styles.headerCell}>{t('guessList.department')}</th>
              <th className={styles.headerCell}>{t('guessList.office')}</th>
              <th className={styles.headerCell}>{t('guessList.teams')}</th>
              <th className={styles.headerCell}>{t('guessList.age')}</th>
              <th className={styles.headerCell}>{t('guessList.supervisor')}</th>
            </tr>
          </thead>
          <tbody>
            {guesses.map((guess, guessIndex) => {
              const isAnimated = animatedGuesses.has(guessIndex);
              // Pre-existing guesses (loaded from server on refresh) will flip with staggered delays
              const isPreExisting = guessIndex < initialLengthRef.current;
              const baseDelay = 400; // Base delay in ms
              const delayPerBox = 400; // Delay between each box
              
              // Calculate delay: all boxes flip simultaneously for pre-existing guesses (loaded from server on refresh),
              // calculated delay for new guesses added during gameplay
              const getDelay = (boxIndex: number): number => {
                if (!isAnimated) return -1;
                if (isPreExisting) {
                  // For pre-existing guesses (loaded from server), all boxes flip at the same time
                  return 0;
                }
                return baseDelay + delayPerBox * boxIndex; // Animate new guesses
              };

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
                 
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label={t('guessList.department')}
                      value={getHintValue(guess, HintType.Department)}
                      result={getHintResult(guess, HintType.Department)}
                      delay={getDelay(0)}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label={t('guessList.office')}
                      value={getHintValue(guess, HintType.Office)}
                      result={getHintResult(guess, HintType.Office)}
                      delay={getDelay(1)}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label={t('guessList.teams')}
                      value={getHintValue(guess, HintType.Teams)}
                      result={getHintResult(guess, HintType.Teams)}
                      delay={getDelay(2)}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label={t('guessList.age')}
                      value={getHintValue(guess, HintType.Age)}
                      result={getHintResult(guess, HintType.Age)}
                      delay={getDelay(3)}
                      showArrow={getHintArrow(guess, HintType.Age).show}
                      arrowDirection={getHintArrow(guess, HintType.Age).direction}
                    />
                  </td>
                  <td className={styles.hintCell}>
                    <FlipBox
                      label={t('guessList.supervisor')}
                      value={getHintValue(guess, HintType.Supervisor)}
                      result={getHintResult(guess, HintType.Supervisor)}
                      delay={getDelay(4)}
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


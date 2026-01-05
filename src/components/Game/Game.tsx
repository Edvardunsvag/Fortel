import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  loadEmployees,
  selectEmployees,
  selectEmployeesStatus,
  type Employee,
} from '@/features/employees';
import {
  initializeGame,
  revealFunfact,
  makeGuess,
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectGuesses,
  selectTotalGuesses,
  selectGameStatus,
  selectCanGuess,
} from '@/features/game';
import { selectAccount } from '@/features/auth';
import { submitScore, fetchLeaderboard, selectLeaderboard } from '@/features/leaderboard';
import { AsyncStatus } from '@/shared/redux/enums';
import { getTodayDateString, getDateSeed, selectIndexBySeed } from '@/shared/utils/dateUtils';
import { findMatchingEmployee } from '@/shared/utils/nameMatcher';
import { compareTwoStrings } from 'string-similarity';
import { hashEmployeeId, findEmployeeByHash } from '@/shared/utils/hashUtils';
import { GuessInput } from './GuessInput';
import { GuessList } from './GuessList';
import { GameStatus } from './GameStatus';
import styles from './Game.module.scss';
import pageStyles from '../Pages/Pages.module.scss';

export const Game = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const employeeOfTheDayId = useAppSelector(selectEmployeeOfTheDayId);
  const funfactRevealed = useAppSelector(selectFunfactRevealed);
  const guesses = useAppSelector(selectGuesses);
  const totalGuesses = useAppSelector(selectTotalGuesses);
  const gameStatus = useAppSelector(selectGameStatus);
  const account = useAppSelector(selectAccount);
  const userId = account?.localAccountId || account?.username || null;
  const userName = account?.name || account?.username || null;
  const leaderboard = useAppSelector(selectLeaderboard);

  // Helper: Normalize name for comparison
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Check if user is in today's leaderboard
  const isInLeaderboard = userName && leaderboard?.leaderboard.some((entry) => {
    const normalizedUserName = normalizeName(userName);
    const normalizedEntryName = normalizeName(entry.name);

    if (normalizedUserName === normalizedEntryName) {
      return true;
    }

    const similarity = compareTwoStrings(normalizedUserName, normalizedEntryName);
    return similarity >= 0.8;
  }) || false;
  
  const canGuess = useAppSelector((state) => selectCanGuess(state, userId, isInLeaderboard));
  
  const hasSubmittedScore = useRef(false);
  const hasTriggeredConfetti = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [showStatusMessage, setShowStatusMessage] = useState(false);

  // Load employees on mount only if status is idle
  useEffect(() => {
    if (employeesStatus === AsyncStatus.Idle && employees.length === 0) {
      dispatch(loadEmployees());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load leaderboard on mount to check if user is already in it
  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  // Initialize game with employee of the day
  useEffect(() => {
    if (employeesStatus !== AsyncStatus.Succeeded || employees.length === 0) return;

    const today = getTodayDateString();
    const needsInitialization = !employeeOfTheDayId;
    const currentEmployeeExists = employeeOfTheDayId
      ? employees.some(emp => hashEmployeeId(emp.id, today) === employeeOfTheDayId)
      : false;

    if (needsInitialization || !currentEmployeeExists) {
      const seed = getDateSeed(today);
      const index = selectIndexBySeed(seed, employees.length);
      const selectedEmployee = employees[index];

      if (selectedEmployee) {
        dispatch(initializeGame(selectedEmployee.id));
      }
    }
  }, [dispatch, employeesStatus, employees, employeeOfTheDayId]);

  // Automatically submit score when game is won
  useEffect(() => {
    if (gameStatus === 'won' && !hasSubmittedScore.current && account && totalGuesses > 0) {
      const submitUserName = account.name || account.username;
      if (!submitUserName) return;

      const matchingEmployee = findMatchingEmployee(submitUserName, employees);
      const avatarImageUrl = matchingEmployee?.avatarImageUrl;

      if (matchingEmployee) {
        console.log(`Found matching employee for ${submitUserName}: ${matchingEmployee.name}`);
      } else {
        console.log(`No matching employee found for ${submitUserName}`);
      }

      hasSubmittedScore.current = true;
      dispatch(submitScore({
        name: submitUserName,
        score: totalGuesses,
        avatarImageUrl,
      }))
        .then(() => {
          dispatch(fetchLeaderboard());
        })
        .catch((error) => {
          console.error('Failed to submit score:', error);
        });
    }
  }, [gameStatus, account, totalGuesses, employees, dispatch]);

  // Reset submission flag when game is reset (new day or re-initialized)
  useEffect(() => {
    if (gameStatus === 'playing' || gameStatus === 'idle') {
      hasSubmittedScore.current = false;
      hasTriggeredConfetti.current = false;
      setShowStatusMessage(false);
    }
  }, [gameStatus]);

  // Helper: Trigger confetti animation
  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 90,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };
    frame();
  };

  // Show status message and trigger confetti when game is won
  useEffect(() => {
    if (gameStatus === 'won' && !hasTriggeredConfetti.current && totalGuesses > 0) {
      // Wait for last box animation to finish (3100ms total)
      const animationDelay = 3100;

      const animationTimer = setTimeout(() => {
        setShowStatusMessage(true);
        triggerConfetti();
        hasTriggeredConfetti.current = true;
      }, animationDelay);

      return () => clearTimeout(animationTimer);
    }

    if (gameStatus === 'lost') {
      setShowStatusMessage(true);
    }
  }, [gameStatus, totalGuesses]);

  const handleGuess = (employeeId: string) => {
    if (!canGuess || !employeeOfTheDayId) {
      console.warn('Cannot guess:', { canGuess, employeeOfTheDayId });
      return;
    }

    const guessedEmployee = employees.find((emp) => emp.id === employeeId);

    if (!guessedEmployee) {
      console.warn('Employee not found:', employeeId);
      return;
    }

    // Find target employee by comparing hashed IDs
    const today = getTodayDateString();
    const targetEmployee = findEmployeeByHash<Employee>(employees, employeeOfTheDayId, today);

    if (!targetEmployee) {
      console.error('Target employee not found for hash:', employeeOfTheDayId);
      return;
    }

    console.log('Making guess:', { guessed: guessedEmployee.name, target: targetEmployee.name });
    dispatch(makeGuess({ guessed: guessedEmployee, target: targetEmployee, userId }));
    setInputValue('');
  };

  const handleRevealFunfact = () => {
    dispatch(revealFunfact());
  };

  if (employeesStatus === AsyncStatus.Loading) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.loading}>{t('game.loadingEmployees')}</div>
      </div>
    );
  }

  if (employeesStatus === AsyncStatus.Failed) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.error}>
          {t('game.failedToLoad')}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.empty}>{t('game.noEmployees')}</div>
      </div>
    );
  }

  if (!employeeOfTheDayId) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.loading}>{t('game.initializing')}</div>
      </div>
    );
  }

  // Get target employee for funfact display
  const today = getTodayDateString();
  const targetEmployee = employeeOfTheDayId
    ? findEmployeeByHash<Employee>(employees, employeeOfTheDayId, today)
    : null;

  const targetFunfact = targetEmployee?.funfact || null;
  const targetInterests = targetEmployee?.interests || [];
  const hasNoFunfactOrInterests = !targetFunfact && (!targetInterests || targetInterests.length === 0);

  return (
    <div className={pageStyles.container}>
      <h1 className={pageStyles.title}>{t('game.title')}</h1>
      <div className={styles.headerInfo}>
        <p className={pageStyles.subtitle}>{t('game.subtitle')}</p>
        {gameStatus === 'playing' && (
          <div className={styles.guessCountBadge}>
            {t('game.guesses')}: <strong>{totalGuesses}</strong>
          </div>
        )}
      </div>

      {funfactRevealed && targetEmployee && (
        <div className={styles.funfactClueContainer}>
          {hasNoFunfactOrInterests ? (
            <p className={`${styles.funfactClueText} ${styles.funfactClueTextNoContent}`}>
              {t('game.noFunfactOrInterests')}
            </p>
          ) : (
            <>
              <h3 className={styles.funfactClueTitle}>{t('guessList.funfactClue')}</h3>
              {targetFunfact && (
                <p className={styles.funfactClueText}>{targetFunfact}</p>
              )}
              {targetInterests.length > 0 && (
                <div className={styles.interestsContainer}>
                  <h4 className={styles.interestsTitle}>{t('guessList.interests')}</h4>
                  <div className={styles.interestsList}>
                    {targetInterests.map((interest, index) => (
                      <span key={index} className={styles.interestTag}>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className={pageStyles.content}>
        {((gameStatus === 'won' && showStatusMessage) || gameStatus === 'lost') && (
          <GameStatus
            status={gameStatus}
            guesses={guesses}
            visible={true}
          />
        )}

        {isInLeaderboard && gameStatus === 'playing' && (
          <div className={styles.attemptedMessage} role="alert">
            {t('game.alreadyAttempted')}
          </div>
        )}

        {canGuess && (
          <div className={styles.inputRow}>
            <div className={styles.inputContainer}>
              <GuessInput
                value={inputValue}
                onChange={setInputValue}
                onGuess={handleGuess}
                employees={employees}
                guessedEmployeeIds={guesses.map(guess => guess.employeeId)}
              />
            </div>
            {gameStatus === 'playing' && (
              <button
                className={styles.revealButton}
                onClick={handleRevealFunfact}
                type="button"
                disabled={funfactRevealed}
              >
                {t('game.buyInterests')}
              </button>
            )}
          </div>
        )}

        <GuessList guesses={guesses} />
      </div>
    </div>
  );
};


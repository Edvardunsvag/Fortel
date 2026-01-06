import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  loadEmployees,
  selectEmployees,
  selectEmployeesStatus,
} from '@/features/employees/employeesSlice';
import type { Employee } from '@/features/employees/types';
import {
  initializeGame,
  revealFunfact,
  makeGuess,
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectGuesses,
  selectTotalGuesses,
  selectGameStatus,
  loadRoundFromServer,
  startRoundOnServer,
  saveGuessToServer,
  calculateHintsForGuess,
} from '@/features/game/gameSlice';
import type { Guess } from '@/features/game/types';
import { selectAccount } from '@/features/auth/authSlice';
import { submitScore, fetchLeaderboard, selectLeaderboard } from '@/features/leaderboard/leaderboardSlice';
import { AsyncStatus } from '@/shared/redux/enums';
import { getTodayDateString, getDateSeed, selectIndexBySeed } from '@/shared/utils/dateUtils';
import { findMatchingEmployee } from '@/shared/utils/nameMatcher';
import { compareTwoStrings } from 'string-similarity';
import { hashEmployeeId, findEmployeeByHash } from '@/shared/utils/hashUtils';
import { GuessInput } from './GuessInput';
import { GuessList } from './GuessList';
import { GameStatus } from './GameStatus';
import styles from './Game.module.scss';

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
  
  // const canGuess = useAppSelector((state) => selectCanGuess(state, userId, isInLeaderboard));
  const canGuess = true;
  
  const hasSubmittedScore = useRef(false);
  const hasTriggeredConfetti = useRef(false);
  const hasSavedFunfactReveal = useRef(false);

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

  // Load existing round from server on mount (if user is logged in)
  useEffect(() => {
    if (!userId || employeesStatus !== AsyncStatus.Succeeded) return;

    const today = getTodayDateString();
    dispatch(loadRoundFromServer({ userId, date: today }))
      .then((result) => {
        if (loadRoundFromServer.fulfilled.match(result) && result.payload) {
          console.log('Loaded existing round from server');
        } else {
          console.log('No existing round found');
        }
      })
      .catch((error) => {
        console.error('Failed to load round:', error);
      });
  }, [dispatch, userId, employeesStatus]);

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
        const hashedId = hashEmployeeId(selectedEmployee.id, today);
        dispatch(initializeGame(selectedEmployee.id));
        
        // Start round on server if user is logged in
        if (userId) {
          dispatch(startRoundOnServer({
            userId,
            date: today,
            employeeOfTheDayId: hashedId,
          })).catch((error) => {
            console.error('Failed to start round on server:', error);
          });
        }
      }
    }
  }, [dispatch, employeesStatus, employees, employeeOfTheDayId, userId]);

  // Save funfact reveal to server when it changes
  // The revealFunfact action adds 2 dummy guesses, so we need to save both
  useEffect(() => {
    if (funfactRevealed && userId && employeeOfTheDayId && !hasSavedFunfactReveal.current) {
      hasSavedFunfactReveal.current = true;
      const today = getTodayDateString();
      // Save two dummy guesses to match the client state (revealFunfact adds 2)
      const dummyGuess: Guess = {
        employeeId: '',
        employeeName: '',
        hints: [],
        isCorrect: false,
      };
      
      // Save first dummy guess
      dispatch(saveGuessToServer({
        userId,
        date: today,
        guess: dummyGuess,
        funfactRevealed: true,
      }))
        .then(() => {
          // Save second dummy guess
          return dispatch(saveGuessToServer({
            userId,
            date: today,
            guess: dummyGuess,
            funfactRevealed: true,
          }));
        })
        .catch((error) => {
          console.error('Failed to save funfact reveal to server:', error);
          hasSavedFunfactReveal.current = false; // Reset on error so we can retry
        });
    }
  }, [funfactRevealed, userId, employeeOfTheDayId, dispatch]);

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
      hasSavedFunfactReveal.current = false;
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
  }, [gameStatus, totalGuesses]);

  const handleGuess = async (employeeId: string) => {
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

    // Make guess locally first
    dispatch(makeGuess({ guessed: guessedEmployee, target: targetEmployee, userId }));
    
    // Save to server if user is logged in
    if (userId) {
      const hints = calculateHintsForGuess(guessedEmployee, targetEmployee);
      const guess: Guess = {
        employeeId: guessedEmployee.id,
        employeeName: guessedEmployee.name,
        avatarImageUrl: guessedEmployee.avatarImageUrl,
        hints,
        isCorrect: guessedEmployee.id === targetEmployee.id,
      };

      dispatch(saveGuessToServer({
        userId,
        date: today,
        guess,
        funfactRevealed,
      })).catch((error) => {
        console.error('Failed to save guess to server:', error);
      });
    }

    setInputValue('');
  };

  const handleRevealFunfact = () => {
    dispatch(revealFunfact());
    
    // Save funfact reveal to server if user is logged in
    // Note: The revealFunfact action adds 2 dummy guesses to the state
    // We'll save the funfactRevealed flag via a useEffect that watches for changes
  };

  if (employeesStatus === AsyncStatus.Loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('game.loadingEmployees')}</div>
      </div>
    );
  }

  if (employeesStatus === AsyncStatus.Failed) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {t('game.failedToLoad')}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>{t('game.noEmployees')}</div>
      </div>
    );
  }

  if (!employeeOfTheDayId) {
    return (
      <div className={styles.container}>
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
    <div className={styles.container}>
      <h1 className={styles.title}>{t('game.title')}</h1>
      <div className={styles.headerInfo}>
        <p className={styles.subtitle}>{t('game.subtitle')}</p>
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
                    {targetInterests.map((interest: string, index: number) => (
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

      <div className={styles.content}>
        {(gameStatus === 'won' && showStatusMessage) && (
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


import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectAccount } from '@/features/auth/authSlice';
import {
  loadEmployees,
  selectEmployees,
  selectEmployeesStatus,
} from '@/features/employees/employeesSlice';
import type { Employee } from '@/features/employees/types';
import {
  calculateHintsForGuess,
  initializeGame,
  loadRoundFromServer,
  makeGuess,
  revealFunfact,
  saveGuessToServer,
  selectCanGuess,
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectGameStatus,
  selectGuesses,
  selectTotalGuesses,
  startRoundOnServer,
} from '@/features/game/gameSlice';
import type { Guess } from '@/features/game/types';
import { toSaveGuessRequest, toStartRoundRequest } from '@/features/game/toDto';
import { toSubmitScoreRequest } from '@/features/leaderboard/toDto';
import { fetchLeaderboard, selectLeaderboard, submitScore } from '@/features/leaderboard/leaderboardSlice';
import { AsyncStatus } from '@/shared/redux/enums';
import { getDateSeed, getTodayDateString, selectIndexBySeed } from '@/shared/utils/dateUtils';
import { findEmployeeByHash, hashEmployeeId } from '@/shared/utils/hashUtils';
import { findMatchingEmployee } from '@/shared/utils/nameMatcher';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { compareTwoStrings } from 'string-similarity';
import { triggerConfetti } from '../utils';
import styles from './Game.module.scss';
import { GameStatus } from './GameStatus';
import { GuessInput } from './GuessInput';
import { GuessList } from './GuessList';

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
  
  const canGuess = useAppSelector((state) => selectCanGuess(state, isInLeaderboard));
  
  const hasSubmittedScore = useRef(false);
  const hasTriggeredConfetti = useRef(false);
  const hasSavedFunfactReveal = useRef(false);
  const hasLoadedRoundFromServer = useRef(false);
  const roundLoadCompleted = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [showStatusMessage, setShowStatusMessage] = useState(false);

  // Track if we're currently loading from server to prevent saving during load
  const isLoadingFromServerRef = useRef(false);

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
    // Reset flags for this load attempt
    hasLoadedRoundFromServer.current = false;
    roundLoadCompleted.current = false;
    // Set flag to prevent funfact reveal effect from running during load
    isLoadingFromServerRef.current = true;
    
    dispatch(loadRoundFromServer({ userId, date: today }))
      .then((result) => {
        if (loadRoundFromServer.fulfilled.match(result) && result.payload) {
          console.log('Loaded existing round from server');
          hasLoadedRoundFromServer.current = true;
          // If funfact was already revealed on the server, mark it as saved to prevent re-saving dummy guesses
          if (result.payload.funfactRevealed) {
            hasSavedFunfactReveal.current = true;
          }
        } else {
          console.log('No existing round found');
          hasLoadedRoundFromServer.current = false;
        }
      })
      .catch((error) => {
        console.error('Failed to load round:', error);
        hasLoadedRoundFromServer.current = false;
      })
      .finally(() => {
        roundLoadCompleted.current = true;
        // Clear the flag after a short delay to allow state updates to complete
        setTimeout(() => {
          isLoadingFromServerRef.current = false;
        }, 100);
      });
  }, [dispatch, userId, employeesStatus]);

  // Initialize game with employee of the day
  // Only runs if no round was loaded from server
  useEffect(() => {
    if (employeesStatus !== AsyncStatus.Succeeded || employees.length === 0) return;
    
    // If user is logged in, wait for round load to complete
    if (userId && !roundLoadCompleted.current) {
      return;
    }

    const today = getTodayDateString();
    const needsInitialization = !employeeOfTheDayId;
    const currentEmployeeExists = employeeOfTheDayId
      ? employees.some(emp => hashEmployeeId(emp.id, today) === employeeOfTheDayId)
      : false;

    // Only initialize if:
    // 1. No round was loaded from server (for logged-in users), OR
    // 2. User is not logged in and needs initialization
    const shouldInitialize = (userId ? !hasLoadedRoundFromServer.current : true) && 
                             (needsInitialization || !currentEmployeeExists);

    if (shouldInitialize) {
      const seed = getDateSeed(today);
      const index = selectIndexBySeed(seed, employees.length);
      const selectedEmployee = employees[index];

      if (selectedEmployee) {
        const hashedId = hashEmployeeId(selectedEmployee.id, today);
        dispatch(initializeGame(selectedEmployee.id));
        
        // Start round on server if user is logged in
        if (userId) {
          const request = toStartRoundRequest(userId, today, hashedId);
          dispatch(startRoundOnServer(request)).catch((error) => {
            console.error('Failed to start round on server:', error);
          });
        }
      }
    }
  }, [dispatch, employeesStatus, employees, employeeOfTheDayId, userId]);
  
  // Save funfact reveal to server when it changes
  // The revealFunfact action adds 2 dummy guesses, so we need to save both
  // Only save if funfact was just revealed by user (not when loaded from server)
  useEffect(() => {
    // Skip if we're currently loading from server
    if (isLoadingFromServerRef.current) {
      return;
    }
    
    // Check if funfact was just revealed by checking if dummy guesses were just added
    // When loaded from server, funfactRevealed is true but no new dummy guesses were added
    const hasDummyGuesses = totalGuesses > guesses.length;
    const wasJustRevealed = funfactRevealed && hasDummyGuesses && !hasSavedFunfactReveal.current;
    
    if (wasJustRevealed && userId && employeeOfTheDayId) {
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
      const firstRequest = toSaveGuessRequest(userId, today, dummyGuess, true);
      dispatch(saveGuessToServer(firstRequest))
        .then(() => {
          // Save second dummy guess
          const secondRequest = toSaveGuessRequest(userId, today, dummyGuess, true);
          return dispatch(saveGuessToServer(secondRequest));
        })
        .catch((error) => {
          console.error('Failed to save funfact reveal to server:', error);
          hasSavedFunfactReveal.current = false; // Reset on error so we can retry
        });
    }
  }, [funfactRevealed, userId, employeeOfTheDayId, dispatch, totalGuesses, guesses.length]);

  // Automatically submit score when game is won
  useEffect(() => {
    if (gameStatus === 'won' && !hasSubmittedScore.current && account && totalGuesses > 0) {
      const submitUserName = account.name || account.username;
      if (!submitUserName) return;

      const matchingEmployee = findMatchingEmployee(submitUserName, employees);
      const avatarImageUrl = matchingEmployee?.avatarImageUrl;

      hasSubmittedScore.current = true;
      const submitRequest = toSubmitScoreRequest(submitUserName, totalGuesses, avatarImageUrl);
      dispatch(submitScore(submitRequest))
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

      const request = toSaveGuessRequest(userId, today, guess, funfactRevealed);
      dispatch(saveGuessToServer(request)).catch((error) => {
        console.error('Failed to save guess to server:', error);
      });
    }

    setInputValue('');
  };

  const handleRevealFunfact = () => {
    dispatch(revealFunfact());
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


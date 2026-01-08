import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectAccount } from '@/features/auth/authSlice';
import {
  selectEmployees
} from '@/features/employees/employeesSlice';
import type { Employee } from '@/features/employees/types';
import {
  calculateHintsForGuess,
  FUNFACT_REVEAL_COST,
  loadRoundFromServer,
  revealFunfact,
  revealFunfactOnServer,
  saveGuessToServer,
  selectAttemptedByUserId,
  selectCanGuess,
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectGameStatus,
  selectGuesses,
  selectRoundId,
  selectTotalGuesses,
  startRoundOnServer,
} from '@/features/game/gameSlice';
import { toRevealFunfactRequest, toSaveGuessRequest, toStartRoundRequest } from '@/features/game/toDto';
import type { Guess } from '@/features/game/types';
import { getDateSeed, getTodayDateString, selectIndexBySeed } from '@/shared/utils/dateUtils';
import { findEmployeeByHash, hashEmployeeId } from '@/shared/utils/hashUtils';
import { findMatchingEmployee } from '@/shared/utils/nameMatcher';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { triggerConfetti } from '../utils';
import styles from './Game.module.scss';
import { GameStatus } from './GameStatus';
import { GuessInput } from './GuessInput';
import { selectLeaderboard, submitScore } from '@/features/leaderboard/leaderboardSlice';
import { toSubmitScoreRequest } from '@/features/leaderboard/toDto';
import { GuessList } from './GuessList/GuessList';

export const Game = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectEmployees);
  const employeeOfTheDayId = useAppSelector(selectEmployeeOfTheDayId);
  const funfactRevealed = useAppSelector(selectFunfactRevealed);
  const guesses = useAppSelector(selectGuesses);
  const totalGuesses = useAppSelector(selectTotalGuesses);
  const gameStatus = useAppSelector(selectGameStatus);
  const account = useAppSelector(selectAccount);
  const userId = account?.localAccountId || account?.username || null;
  const attemptedByUserId = useAppSelector(selectAttemptedByUserId);
  const canGuess = useAppSelector(selectCanGuess);
  const leaderboard = useAppSelector(selectLeaderboard);
  const roundId = useAppSelector(selectRoundId);

  const [inputValue, setInputValue] = useState('');
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  
  // Load existing round from server on mount (if user is logged in and has attempted)
  useEffect(() => {
    if (!userId || attemptedByUserId) return;

    const today = getTodayDateString();
    
    dispatch(loadRoundFromServer({ userId, date: today }));
  }, [dispatch, userId, attemptedByUserId]);
 

  // Show status message and trigger confetti when game is won
  useEffect(() => {
    if (gameStatus === 'won' && totalGuesses > 0) {
      // Wait for last box animation to finish (3100ms total)
      const animationDelay = 3100;

      const animationTimer = setTimeout(() => {
        setShowStatusMessage(true);
        triggerConfetti();
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

    // Save to server if user is logged in
    if (userId) {
      const hints = calculateHintsForGuess(guessedEmployee, targetEmployee);
      const isCorrect = guessedEmployee.id === targetEmployee.id;
      const guess: Guess = {
        employeeId: guessedEmployee.id,
        employeeName: guessedEmployee.name,
        avatarImageUrl: guessedEmployee.avatarImageUrl,
        hints,
        isCorrect,
      };

      const request = toSaveGuessRequest(userId, today, guess);
      dispatch(saveGuessToServer(request))
        .then(() => {
          // Submit score to leaderboard if guess is correct and user is not already on leaderboard
          if (isCorrect && account?.name) {
            // Check if user is already on the leaderboard for today
            const userHasAttempted = leaderboard?.leaderboard.find(
              entry => entry.name === account.name
            );
            
            if (!userHasAttempted) {
              // Calculate score: current guesses + 1 (for this correct guess) + funfact cost if revealed
              const score = guesses.length + 1 + (funfactRevealed ? FUNFACT_REVEAL_COST : 0);
              
              // Find the user's employee record to get their avatar
              const userEmployee = findMatchingEmployee(account.name, employees);
              const avatarImageUrl = userEmployee?.avatarImageUrl;
              
              const scoreRequest = toSubmitScoreRequest(
                account.name,
                score,
                avatarImageUrl
              );
              dispatch(submitScore(scoreRequest)).catch((error) => {
                console.error('Failed to submit score to leaderboard:', error);
              });
            }
          }
        })
        .catch((error) => {
          console.error('Failed to save guess to server:', error);
        });
    }

    setInputValue('');
  };

  const handleRevealFunfact = () => {
    if (!roundId) {
      console.warn('Cannot reveal funfact: roundId is not available');
      return;
    }
    
    // Update local state
    dispatch(revealFunfact());
    
    // Save to server
    const request = toRevealFunfactRequest(roundId);
    dispatch(revealFunfactOnServer(request)).catch((error) => {
      console.error('Failed to reveal funfact on server:', error);
    });
  };

  const handleStartGame = async () => {
    if (!userId || isStartingGame || employeeOfTheDayId) return;

    setIsStartingGame(true);
    const today = getTodayDateString();
    
    // Calculate employee of the day
    const seed = getDateSeed(today);
    const index = selectIndexBySeed(seed, employees.length);
    const selectedEmployee = employees[index];

    if (!selectedEmployee) {
      setIsStartingGame(false);
      return;
    }

    const hashedId = hashEmployeeId(selectedEmployee.id, today);
    const request = toStartRoundRequest(userId, today, hashedId);
    
    try {
      await dispatch(startRoundOnServer(request)).unwrap();
      // The startRoundOnServer thunk already loads the round into state via loadRoundFromState
    } catch (error) {
      console.error('Failed to start round on server:', error);
      setIsStartingGame(false);
    }
  };


  const userHasAttempted = leaderboard?.leaderboard.find(entry => entry.name === account?.name);

  if(userHasAttempted) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            {t('game.alreadyAttempted')}
          </div>
        </div>
      </div>
    );
  }
  if (employees.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>{t('game.noEmployees')}</div>
        </div>
      </div>
    );
  }

  // Show start button if game hasn't started yet
  if (!employeeOfTheDayId && userId && !attemptedByUserId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('game.title')}</h1>
          <p className={styles.subtitle}>{t('game.subtitle')}</p>
          <button
            className={styles.startButton}
            onClick={handleStartGame}
            type="button"
            disabled={isStartingGame || employees.length === 0}
          >
            {isStartingGame ? t('game.startingGame') : t('game.startGame')}
          </button>
        </div>
      </div>
    );
  }

  if (!employeeOfTheDayId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>{t('game.initializing')}</div>
        </div>
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
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('game.title')}</h1>
        <div className={styles.headerInfo}>
          <p className={styles.subtitle}>{t('game.subtitle')}  {account?.name}!</p>
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
    </div>
  );
};


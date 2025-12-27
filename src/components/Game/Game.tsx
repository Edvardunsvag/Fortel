import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  loadEmployees,
  selectEmployees,
  selectEmployeesStatus,
} from '@/features/employees';
import {
  initializeGame,
  makeGuess,
  selectEmployeeOfTheDayId,
  selectGuesses,
  selectGameStatus,
  selectCanGuess,
} from '@/features/game';
import { selectAccount } from '@/features/auth';
import { submitScore, fetchLeaderboard, selectLeaderboard } from '@/features/leaderboard';
import { AsyncStatus } from '@/shared/redux/enums';
import { getTodayDateString, getDateSeed, selectIndexBySeed } from '@/shared/utils/dateUtils';
import { findMatchingEmployee } from '@/shared/utils/nameMatcher';
import { compareTwoStrings } from 'string-similarity';
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
  const guesses = useAppSelector(selectGuesses);
  const gameStatus = useAppSelector(selectGameStatus);
  const account = useAppSelector(selectAccount);
  const userId = account?.localAccountId || account?.username || null;
  const userName = account?.name || account?.username || null;
  const leaderboard = useAppSelector(selectLeaderboard);
  
  // Check if user is in today's leaderboard using the same string comparison as nameMatcher
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  };
  
  const isInLeaderboard = userName && leaderboard?.leaderboard.some((entry) => {
    const normalizedUserName = normalizeName(userName);
    const normalizedEntryName = normalizeName(entry.name);
    
    // Try exact match first
    if (normalizedUserName === normalizedEntryName) {
      return true;
    }
    
    // Use string similarity with threshold (same as nameMatcher)
    const similarity = compareTwoStrings(normalizedUserName, normalizedEntryName);
    return similarity >= 0.8; // Higher threshold for leaderboard matching (80% similarity)
  }) || false;
  
  const canGuess = useAppSelector((state) => selectCanGuess(state, userId, isInLeaderboard));
  const hasSubmittedScore = useRef(false);

  const [inputValue, setInputValue] = useState('');

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

  useEffect(() => {
    if (employeesStatus === AsyncStatus.Succeeded && employees.length > 0) {
      const today = getTodayDateString();
      
      // Check if we need to initialize or re-initialize
      const needsInitialization = !employeeOfTheDayId;
      
      // Check if the current employee of the day still exists in the list
      const currentEmployeeExists = employeeOfTheDayId 
        ? employees.some(emp => emp.id === employeeOfTheDayId)
        : false;
      
      if (needsInitialization || !currentEmployeeExists) {
        // Select a deterministic employee for the day based on the date
        // This ensures everyone gets the same employee on the same day
        const seed = getDateSeed(today);
        const index = selectIndexBySeed(seed, employees.length);
        const selectedEmployee = employees[index];
        
        if (selectedEmployee) {
          console.log(`Selected employee of the day: ${selectedEmployee.name} (${selectedEmployee.id})`);
          dispatch(initializeGame(selectedEmployee.id));
        }
      }
    }
  }, [dispatch, employeesStatus, employees, employeeOfTheDayId]);

  // Automatically submit score when game is won
  useEffect(() => {
    if (gameStatus === 'won' && !hasSubmittedScore.current && account && guesses.length > 0) {
      const userName = account.name || account.username;
      if (userName) {
        // Find the matching employee for the logged-in user
        const matchingEmployee = findMatchingEmployee(userName, employees);
        const avatarImageUrl = matchingEmployee?.avatarImageUrl;
        
        if (matchingEmployee) {
          console.log(`Found matching employee for ${userName}: ${matchingEmployee.name}`);
        } else {
          console.log(`No matching employee found for ${userName}`);
        }
        
        hasSubmittedScore.current = true;
        dispatch(submitScore({ 
          name: userName, 
          score: guesses.length,
          avatarImageUrl 
        }))
          .then(() => {
            // Refresh leaderboard after successful submission
            dispatch(fetchLeaderboard());
          })
          .catch((error) => {
            console.error('Failed to submit score:', error);
          });
      }
    }
  }, [gameStatus, account, guesses.length, employees, dispatch]);

  // Reset submission flag when game is reset (new day or re-initialized)
  useEffect(() => {
    if (gameStatus === 'playing' || gameStatus === 'idle') {
      hasSubmittedScore.current = false;
    }
  }, [gameStatus]);

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

    const targetEmployee = employees.find((emp) => emp.id === employeeOfTheDayId);

    if (!targetEmployee) {
      console.error('Target employee not found:', employeeOfTheDayId);
      return;
    }

    console.log('Making guess:', { guessed: guessedEmployee.name, target: targetEmployee.name });
    dispatch(makeGuess({ guessed: guessedEmployee, target: targetEmployee, userId }));
    setInputValue('');
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

  return (
    <div className={pageStyles.container}>
      <h1 className={pageStyles.title}>{t('game.title')}</h1>
      <p className={pageStyles.subtitle}>{t('game.subtitle')}</p>

      
      <div className={pageStyles.content}>
        <GameStatus
          status={gameStatus}
          guesses={guesses}
        />

        {isInLeaderboard && gameStatus === 'playing' && (
          <div className={styles.attemptedMessage} role="alert">
            {t('game.alreadyAttempted')}
          </div>
        )}

        {gameStatus === 'playing' && !isInLeaderboard && (
          <GuessInput
            value={inputValue}
            onChange={setInputValue}
            onGuess={handleGuess}
            employees={employees}
            disabled={!canGuess || isInLeaderboard}
          />
        )}

        <GuessList guesses={guesses} />
      </div>
    </div>
  );
};


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
  selectMode,
  initializeEmployees,
  makeGuess,
  selectGameMode,
  selectEmployeeOfTheDayId,
  selectClassicEmployeeOfTheDayId,
  selectFunfactEmployeeOfTheDayId,
  selectGuesses,
  selectGameStatus,
  selectCanGuess,
  GameMode,
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
import { GameModeSelection } from './GameModeSelection';
import styles from './Game.module.scss';
import pageStyles from '../Pages/Pages.module.scss';

export const Game = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const gameMode = useAppSelector(selectGameMode);
  const classicEmployeeOfTheDayId = useAppSelector(selectClassicEmployeeOfTheDayId);
  const funfactEmployeeOfTheDayId = useAppSelector(selectFunfactEmployeeOfTheDayId);
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

  useEffect(() => {
    if (employeesStatus === AsyncStatus.Succeeded && employees.length > 0) {
      const today = getTodayDateString();
      
      // Check if we need to initialize both employees
      const needsInitialization = !classicEmployeeOfTheDayId || !funfactEmployeeOfTheDayId;
      
      // Check if the current employees still exist in the list
      const classicEmployeeExists = classicEmployeeOfTheDayId 
        ? employees.some(emp => hashEmployeeId(emp.id, today) === classicEmployeeOfTheDayId)
        : false;
      const funfactEmployeeExists = funfactEmployeeOfTheDayId 
        ? employees.some(emp => hashEmployeeId(emp.id, today) === funfactEmployeeOfTheDayId)
        : false;
      
      if (needsInitialization || !classicEmployeeExists || !funfactEmployeeExists) {
        // Select deterministic employees for the day based on the date
        // Use different seeds to ensure different employees for classic and funfact modes
        const todaySeed = getDateSeed(today);
        const classicSeed = todaySeed;
        // Use a different seed calculation for funfact to ensure different employee
        // Multiply by a prime number and add offset to ensure different result
        const funfactSeed = (todaySeed * 31 + 17) % (employees.length * 2);
        
        const classicIndex = selectIndexBySeed(classicSeed, employees.length);
        let funfactIndex = selectIndexBySeed(funfactSeed, employees.length);
        
        // Ensure funfact employee is different from classic employee
        if (funfactIndex === classicIndex && employees.length > 1) {
          funfactIndex = (funfactIndex + 1) % employees.length;
        }
        
        const classicEmployee = employees[classicIndex];
        const funfactEmployee = employees[funfactIndex];
        
        if (classicEmployee && funfactEmployee) {
          dispatch(initializeEmployees({
            classicEmployeeId: classicEmployee.id,
            funfactEmployeeId: funfactEmployee.id,
          }));
        }
      }
    }
  }, [dispatch, employeesStatus, employees, classicEmployeeOfTheDayId, funfactEmployeeOfTheDayId]);

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
      hasTriggeredConfetti.current = false;
      setShowStatusMessage(false);
    }
  }, [gameStatus]);

  // Show status message and trigger confetti when game is won, after the last box finishes flipping
  useEffect(() => {
    if (gameStatus === 'won' && !hasTriggeredConfetti.current && guesses.length > 0) {
      // Calculate timing: last box (supervisor, index 4) finishes flipping
      // Initial delay: 100ms + base delay: 400ms + box delay: 400ms * 4 = 2100ms
      // Flip animation duration: 1000ms
      // Total: 3100ms
      const animationDelay = 3100;
      
      const animationTimer = setTimeout(() => {
        // Show status message
        setShowStatusMessage(true);
        
        // Trigger confetti from multiple points for a full-screen effect
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

        const frame = () => {
          if (Date.now() > end) return;

          // Launch confetti from left, center, and right
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

        hasTriggeredConfetti.current = true;
      }, animationDelay);

      return () => clearTimeout(animationTimer);
    }
    
    // For lost status, show immediately
    if (gameStatus === 'lost') {
      setShowStatusMessage(true);
    }
  }, [gameStatus, guesses.length]);

  const handleGuess = (employeeId: string) => {
    if (!canGuess || !employeeOfTheDayId || !gameMode) {
      console.warn('Cannot guess:', { canGuess, employeeOfTheDayId, gameMode });
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

    console.log('Making guess:', { guessed: guessedEmployee.name, target: targetEmployee.name, mode: gameMode });
    dispatch(makeGuess({ guessed: guessedEmployee, target: targetEmployee, userId, mode: gameMode }));
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

  // Show mode selection if no mode is selected
  if (!gameMode) {
    return <GameModeSelection />;
  }

  if (!employeeOfTheDayId) {
    return (
      <div className={pageStyles.container}>
        <div className={styles.loading}>{t('game.initializing')}</div>
      </div>
    );
  }

  // Get target employee's funfact for FunFact mode
  const targetFunfact = gameMode === GameMode.FunFact && employeeOfTheDayId
    ? (() => {
        const today = getTodayDateString();
        const targetEmployee = findEmployeeByHash<Employee>(employees, employeeOfTheDayId, today);
        return targetEmployee?.funfact || null;
      })()
    : null;

  return (
    <div className={pageStyles.container}>
      <h1 className={pageStyles.title}>{t('game.title')}</h1>
      <div className={styles.headerInfo}>
        <p className={pageStyles.subtitle}>
          {gameMode === GameMode.FunFact 
            ? t('game.modeSelection.funfact.description')
            : t('game.subtitle')
          }
        </p>
        {gameStatus === 'playing' && (
          <div className={styles.guessCountBadge}>
            {t('game.guesses')}: <strong>{guesses.length}</strong>
          </div>
        )}
      </div>

      {gameMode === GameMode.FunFact && targetFunfact && (
        <div className={styles.funfactClueContainer}>
          <h3 className={styles.funfactClueTitle}>{t('guessList.funfactClue')}</h3>
          <p className={styles.funfactClueText}>{targetFunfact}</p>
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
          <GuessInput
            value={inputValue}
            onChange={setInputValue}
            onGuess={handleGuess}
            employees={employees}
          />
        )}

        <GuessList guesses={guesses} />
      </div>
    </div>
  );
};


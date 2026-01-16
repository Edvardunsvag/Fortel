import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectAccount } from "@/features/auth/authSlice";
import { useEmployees } from "@/features/game/employees";
import type { Employee } from "@/features/game/employees/types";
import {
  calculateHintsForGuess,
  loadRoundFromState,
  selectAttemptedByUserId,
  selectEmployeeOfTheDayId,
  selectGameStatus,
  selectGuesses,
  selectFunfactRevealCost,
} from "@/features/game/gameSlice";
import { useCurrentRound, useStartRound, useSaveGuess } from "@/features/game/queries";
import { toSaveGuessRequest, toStartRoundRequest } from "@/features/game/toDto";
import type { Guess } from "@/features/game/types";
import { getDateSeed, getTodayDateString, selectIndexBySeed } from "@/shared/utils/dateUtils";
import { findEmployeeByHash, hashEmployeeId } from "@/shared/utils/hashUtils";
import { findMatchingEmployee } from "@/shared/utils/nameMatcher";
import { useEffect, useState } from "react";
import { triggerConfetti } from "@/features/game/utils";
import styles from "./Game.module.scss";
import { GameStatus } from "./GameStatus";
import { GameHeader } from "./GameHeader";
import { FunfactReveal } from "./FunfactReveal";
import { GameInputRow } from "./GameInputRow";
import { StartGameButton } from "./StartGameButton";

import { GuessList } from "./GuessList/GuessList";
import { GameNavigationChips } from "./GameNavigationChips";
import { useLeaderboard, useSubmitScore } from "../leaderboard/queries";
import { toSubmitScoreRequest } from "../leaderboard/toDto";

export const Game = () => {
  const dispatch = useAppDispatch();
  const { data: employees = [] } = useEmployees();
  const employeeOfTheDayId = useAppSelector(selectEmployeeOfTheDayId);
  const guesses = useAppSelector(selectGuesses);
  const gameStatus = useAppSelector(selectGameStatus);
  const funfactRevealCost = useAppSelector(selectFunfactRevealCost);
  const account = useAppSelector(selectAccount);
  const userId = account?.localAccountId || account?.username || null;
  const attemptedByUserId = useAppSelector(selectAttemptedByUserId);
  const { data: leaderboard } = useLeaderboard();

  const today = getTodayDateString();
  const startRoundMutation = useStartRound();
  const saveGuessMutation = useSaveGuess();
  const submitScoreMutation = useSubmitScore();
  const { data: currentRound } = useCurrentRound(userId || "", today, !!userId && !attemptedByUserId);

  const [inputValue, setInputValue] = useState("");
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Load round from server into Redux state when it's fetched
  useEffect(() => {
    if (currentRound) {
      dispatch(loadRoundFromState({ round: currentRound }));
    }
  }, [currentRound, dispatch]);

  // Show status message and trigger confetti when game is won
  useEffect(() => {
    if (gameStatus === "won" && guesses.length > 0) {
      // Check if the last guess is correct
      const lastGuess = guesses[guesses.length - 1];
      if (lastGuess?.isCorrect) {
        // Wait for last box animation to finish (3100ms total)
        const animationDelay = 3100;

        const animationTimer = setTimeout(() => {
          setShowStatusMessage(true);
          triggerConfetti();
        }, animationDelay);

        return () => clearTimeout(animationTimer);
      }
    }
  }, [gameStatus, guesses]);

  const handleGuess = async (employeeId: string) => {
    // Check if we can make a guess - must be playing and have employeeOfTheDayId
    if (gameStatus !== "playing" || !employeeOfTheDayId) {
      console.warn("Cannot guess:", { gameStatus, employeeOfTheDayId });
      return;
    }

    const guessedEmployee = employees.find((emp) => emp.id === employeeId);

    if (!guessedEmployee) {
      console.warn("Employee not found:", employeeId);
      return;
    }

    // Find target employee by comparing hashed IDs
    const targetEmployee = findEmployeeByHash<Employee>(employees, employeeOfTheDayId, today);

    if (!targetEmployee) {
      console.error("Target employee not found for hash:", employeeOfTheDayId);
      return;
    }

    // Calculate if this is correct by comparing hashed IDs (same logic as makeGuess reducer)
    const guessedHashedId = hashEmployeeId(guessedEmployee.id, today);
    const isCorrect = guessedHashedId === employeeOfTheDayId;

    // Save to server if user is logged in - always save every guess
    if (userId) {
      const hints = calculateHintsForGuess(guessedEmployee, targetEmployee);
      const guess: Guess = {
        employeeId: guessedEmployee.id,
        employeeName: guessedEmployee.name,
        avatarImageUrl: guessedEmployee.avatarImageUrl,
        hints,
        isCorrect,
      };

      const request = toSaveGuessRequest(userId, today, guess);
      try {
        const round = await saveGuessMutation.mutateAsync(request);
        // Update state with the round from server - this will set status to "won" if correct
        dispatch(loadRoundFromState({ round }));

        // Submit score to leaderboard if guess is correct and user is not already on leaderboard
        if (isCorrect && account?.name) {
          // Check if user is already on the leaderboard for today
          const userHasAttempted = leaderboard?.leaderboard.find((entry) => entry.name === account.name);

          if (!userHasAttempted) {
            // Calculate score: use round.guesses.length (which includes the new correct guess) + funfact cost if revealed
            const funfactRevealed = round.funfactRevealed;
            const score = round.guesses.length + (funfactRevealed ? funfactRevealCost : 0);

            // Find the user's employee record to get their avatar
            const userEmployee = findMatchingEmployee(account.name, employees);
            const avatarImageUrl = userEmployee?.avatarImageUrl;

            const scoreRequest = toSubmitScoreRequest(account.name, score, avatarImageUrl);
            submitScoreMutation.mutate(scoreRequest, {
              onError: (error) => {
                console.error("Failed to submit score to leaderboard:", error);
              },
            });
          }
        }
      } catch (error) {
        console.error("Failed to save guess to server:", error);
      }
    }

    setInputValue("");
  };

  const handleStartGame = async () => {
    if (!userId || isStartingGame || employeeOfTheDayId) return;

    setIsStartingGame(true);

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
      const round = await startRoundMutation.mutateAsync(request);
      dispatch(loadRoundFromState({ round }));
    } catch (error) {
      console.error("Failed to start round on server:", error);
      setIsStartingGame(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <GameNavigationChips />
        <GameHeader />
        {gameStatus === "won" && showStatusMessage && (
          <GameStatus status={gameStatus} guesses={guesses} visible={true} />
        )}
        {gameStatus !== "won" && <FunfactReveal employees={employees} />}

        {!employeeOfTheDayId && userId && !attemptedByUserId && (
          <StartGameButton onStartGame={handleStartGame} isStartingGame={isStartingGame} employees={employees} />
        )}
      </div>
      {employeeOfTheDayId && (
        <div className={styles.gameLayout}>
          <div className={styles.gameContent}>
            <GameInputRow
              inputValue={inputValue}
              onInputChange={setInputValue}
              onGuess={handleGuess}
              employees={employees}
            />

            <GuessList guesses={guesses} />
          </div>
        </div>
      )}
    </div>
  );
};

import { useEffect, useState, useRef } from 'react';
import type { Guess } from '@/features/game/types';
import { ANIMATION_CONFIG } from './utils';

/**
 * Custom hook to manage guess animation state
 * Handles initialization, server-loaded guesses, and new guess additions
 */
export const useGuessAnimation = (guesses: Guess[]) => {
  const [animatedGuesses, setAnimatedGuesses] = useState<Set<number>>(new Set());
  const previousLengthRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize on mount - mark existing guesses as animated
    if (!isInitializedRef.current) {
      if (guesses.length > 0) {
        setAnimatedGuesses(new Set(guesses.map((_, index) => index)));
      }
      previousLengthRef.current = guesses.length;
      isInitializedRef.current = true;
      return;
    }

    // Handle guesses loaded from server after initial mount (page refresh)
    if (previousLengthRef.current === 0 && guesses.length > 0) {
      setAnimatedGuesses(new Set(guesses.map((_, index) => index)));
      previousLengthRef.current = guesses.length;
      return;
    }

    // Trigger animation when a new guess is added
    if (guesses.length > previousLengthRef.current) {
      const lastIndex = guesses.length - 1;
      setTimeout(() => {
        setAnimatedGuesses((prev) => new Set([...prev, lastIndex]));
      }, ANIMATION_CONFIG.NEW_GUESS_DELAY);
    }

    previousLengthRef.current = guesses.length;
  }, [guesses.length]);

  return animatedGuesses;
};


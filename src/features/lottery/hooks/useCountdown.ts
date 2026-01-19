import { useState, useEffect, useMemo } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useCountdown = (targetDate: string | null | undefined, isActive: boolean = true) => {
  // Calculate time remaining helper
  const calculateTimeRemaining = (target: Date): TimeRemaining | null => {
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return null;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const countdownTarget = useMemo(() => {
    return targetDate ? new Date(targetDate) : null;
  }, [targetDate]);

  // Initialize with calculated value immediately if available
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(() => {
    if (!targetDate || !isActive) {
      return null;
    }
    const target = new Date(targetDate);
    return calculateTimeRemaining(target);
  });

  useEffect(() => {
    if (!countdownTarget || !isActive) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const result = calculateTimeRemaining(countdownTarget);
      setTimeRemaining(result);
    };

    // Update immediately, then set interval
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [countdownTarget, isActive]);

  return timeRemaining;
};

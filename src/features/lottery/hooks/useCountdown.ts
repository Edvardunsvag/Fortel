import { useState, useEffect, useMemo } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Parses a date string, ensuring it's treated as UTC.
 * The backend sends UTC times, but if the string doesn't have a 'Z' suffix,
 * JavaScript might interpret it as local time, causing timezone issues.
 * This is especially important for Norwegian timezone (CET/CEST) to avoid
 * off-by-one-hour errors during winter time.
 */
export const parseUtcDate = (dateString: string): Date => {
  // If the string already ends with 'Z', it's already UTC
  if (dateString.endsWith("Z")) {
    return new Date(dateString);
  }
  
  // If it ends with a timezone offset (e.g., "+01:00" or "+0100"), parse it directly
  if (dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    return new Date(dateString);
  }
  
  // If it's an ISO-like string with time (contains 'T') but no timezone info,
  // append 'Z' to ensure it's treated as UTC
  // This handles cases where the backend sends UTC time without the 'Z' suffix
  if (dateString.includes("T") && !dateString.includes("Z") && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    return new Date(dateString + "Z");
  }
  
  // For other formats, try parsing directly (fallback)
  return new Date(dateString);
};

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
    return targetDate ? parseUtcDate(targetDate) : null;
  }, [targetDate]);

  // Initialize with calculated value immediately if available
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(() => {
    if (!targetDate || !isActive) {
      return null;
    }
    const target = parseUtcDate(targetDate);
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

/**
 * Generates a deterministic seed from a date string (YYYY-MM-DD)
 * This ensures the same employee is selected for everyone on the same day
 */
export const getDateSeed = (dateString: string): number => {
  // Simple hash function for date string
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Selects a deterministic index from an array based on a seed
 */
export const selectIndexBySeed = (seed: number, arrayLength: number): number => {
  return seed % arrayLength;
};

/**
 * Gets today's date as YYYY-MM-DD string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Formats a date string (YYYY-MM-DD) or ISO string to a readable format based on current language
 * @param dateString - Date string in YYYY-MM-DD format or ISO string
 * @param includeTime - Whether to include time in the formatted string (default: false)
 * @returns Formatted date string in the user's language
 */
export const formatDateReadable = (dateString: string, includeTime = false): string => {
  // Parse the date string
  let date: Date;
  if (dateString.includes("T")) {
    // ISO string
    date = new Date(dateString);
  } else {
    // YYYY-MM-DD format
    const [year, month, day] = dateString.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }

  // Get current language from localStorage or default to English
  const language = localStorage.getItem("fortedle_language") || "en";
  const locale = language === "nb" ? "nb-NO" : "en-US";

  if (includeTime) {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Formats a date string (YYYY-MM-DD) or ISO string to DD.MM format (day.month, no year)
 * @param dateString - Date string in YYYY-MM-DD format or ISO string
 * @returns Formatted date string in DD.MM format
 */
export const formatDateDDMM = (dateString: string): string => {
  // Extract date part if ISO string
  const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString;
  const parts = dateOnly.split("-");
  return `${parts[2]}.${parts[1]}`;
};

/**
 * Formats hours, removing ".00" decimal when present
 * @param hours - Number of hours
 * @returns Formatted hours string (e.g., "40" for 40.00, "40.50" for 40.50)
 */
export const formatHours = (hours: number): string => {
  const formatted = hours.toFixed(2);
  return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted;
};

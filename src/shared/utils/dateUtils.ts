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
  return new Date().toISOString().split('T')[0];
};


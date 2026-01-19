import type { HarvestTimeEntry } from "./types";

/**
 * Detect daily hour pattern (7.5t vs 8t) based on time entries
 * Used to determine the weekly billing target for overtime calculation
 *
 * @param timeEntries - Array of time entries to analyze
 * @returns Object with daily and weekly target hours
 */
export interface DailyHourPattern {
  dailyTarget: 7.5 | 8;
  weeklyTarget: 37.5 | 40;
}

export const detectDailyHourPattern = (timeEntries: HarvestTimeEntry[]): DailyHourPattern => {
  // Filter to only client hours (entries with client !== null)
  const clientEntries = timeEntries.filter((e) => e.client !== null);

  // Group per day and sum hours
  const dailyHours = new Map<string, number>();
  clientEntries.forEach((entry) => {
    const current = dailyHours.get(entry.spent_date) || 0;
    dailyHours.set(entry.spent_date, current + entry.hours);
  });

  // Count "full work days" (7+ hours)
  const fullDays = Array.from(dailyHours.values()).filter((h) => h >= 7);

  if (fullDays.length < 5) {
    return { dailyTarget: 8, weeklyTarget: 40 }; // Default
  }

  // Average of full days
  const avg = fullDays.reduce((a, b) => a + b, 0) / fullDays.length;

  // If average <= 7.75, user typically logs 7.5t
  return avg <= 7.75 ? { dailyTarget: 7.5, weeklyTarget: 37.5 } : { dailyTarget: 8, weeklyTarget: 40 };
};

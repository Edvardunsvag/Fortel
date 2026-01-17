import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  addDays,
  isAfter,
} from "date-fns";

/**
 * Create a week key from a date in format "YYYY-WXX"
 */
export const createWeekKey = (date: Date): string => {
  const weekNumber = getISOWeek(date);
  const weekYear = getISOWeekYear(date);
  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
};

/**
 * Parse a week key into year and week number
 */
export const parseWeekKey = (weekKey: string): { year: number; week: number } => {
  const [yearStr, weekStr] = weekKey.split("-W");
  return {
    year: parseInt(yearStr, 10),
    week: parseInt(weekStr, 10),
  };
};

/**
 * Get the Monday (start) date for a week key
 */
export const getWeekStartFromKey = (weekKey: string): Date => {
  const { year, week } = parseWeekKey(weekKey);
  const jan4 = new Date(year, 0, 4);
  const monday = startOfISOWeek(jan4);
  return addDays(monday, (week - 1) * 7);
};

/**
 * Generate all week keys in a date range (even for weeks without entries)
 */
export const generateWeeksInRange = (rangeFrom: Date, rangeTo: Date): Set<string> => {
  const allWeeks = new Set<string>();
  let currentDate = rangeFrom;

  while (!isAfter(currentDate, rangeTo)) {
    allWeeks.add(createWeekKey(currentDate));
    currentDate = addDays(currentDate, 7);
  }

  return allWeeks;
};

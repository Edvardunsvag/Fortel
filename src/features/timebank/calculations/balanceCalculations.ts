import { addDays, min, max, isBefore } from "date-fns";
import { eachDayOfInterval, isWeekend } from "date-fns";
import type { HarvestTimeEntry } from "@/features/lottery/types";

/**
 * Count working days (Mon-Fri) in a date range
 */
export const countWorkingDays = (from: Date, to: Date): number => {
  const days = eachDayOfInterval({ start: from, end: to });
  return days.filter((day) => !isWeekend(day)).length;
};

/**
 * Count working days in a week, clamped to the given date range
 */
export const countWorkingDaysInWeek = (
  weekStart: Date,
  weekEnd: Date,
  rangeFrom: Date,
  rangeTo: Date
): number => {
  // Clamp week to the date range
  const effectiveStart = max([weekStart, rangeFrom]);
  const effectiveEnd = min([weekEnd, rangeTo]);

  if (isBefore(effectiveEnd, effectiveStart)) {
    return 0;
  }

  return countWorkingDays(effectiveStart, effectiveEnd);
};

/**
 * Calculate total logged hours from entries
 */
export const calculateWeeklyLogged = (entries: HarvestTimeEntry[]): number => {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
};

/**
 * Calculate expected hours for a week based on working days
 */
export const calculateWeeklyExpected = (
  weekStart: Date,
  rangeFrom: Date,
  rangeTo: Date,
  dailyCapacityHours: number
): number => {
  const weekEnd = addDays(weekStart, 4); // Friday
  const workingDays = countWorkingDaysInWeek(weekStart, weekEnd, rangeFrom, rangeTo);
  return workingDays * dailyCapacityHours;
};

/**
 * Calculate weekly balance (logged - expected)
 */
export const calculateWeeklyBalance = (logged: number, expected: number): number => {
  return logged - expected;
};

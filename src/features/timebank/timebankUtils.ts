import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  addDays,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
  eachDayOfInterval,
  isWeekend,
  isBefore,
  isAfter,
  min,
  max,
} from "date-fns";
import type { HarvestTimeEntry } from "@/features/lottery/types";
import { Timeframe } from "./types";
import type { TimeBalance, WeekBalance, DateRange, ProjectEntry } from "./types";

const HOURS_PER_DAY = 8;

/**
 * Check if a time entry is an absence entry (vacation, time off, etc.)
 * These are highlighted in the UI but still count towards logged hours
 */
const isAbsenceEntry = (entry: HarvestTimeEntry): boolean => {
  const projectName = entry.project?.name?.toLowerCase() || "";
  const taskName = entry.task?.name?.toLowerCase() || "";

  // Exclude entries from Internal Absence projects
  if (projectName.includes("absence") || projectName.includes("internal absence")) {
    return true;
  }

  // Exclude specific absence task types
  const absenceTaskPatterns = [
    "absence",
    "avspasering", // Norwegian for time off in lieu
    "vacation",
    "ferie", // Norwegian for vacation
    "sykdom", // Norwegian for sick leave
    "sick",
  ];

  return absenceTaskPatterns.some((pattern) => taskName.includes(pattern));
};

/**
 * Check if a time entry is specifically an Avspasering entry
 * Avspasering hours should be deducted from the time balance
 */
const isAvspaseringsEntry = (entry: HarvestTimeEntry): boolean => {
  const taskName = entry.task?.name?.toLowerCase() || "";
  return taskName.includes("avspasering");
};

/**
 * Get date range based on selected timeframe
 */
export const getDateRangeForTimeframe = (timeframe: Timeframe): DateRange => {
  const today = new Date();

  switch (timeframe) {
    case Timeframe.YearToDate: {
      const yearStart = startOfYear(today);
      return {
        from: format(yearStart, "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      };
    }
    case Timeframe.ThisMonth: {
      const monthStart = startOfMonth(today);
      return {
        from: format(monthStart, "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      };
    }
    case Timeframe.Rolling3Months: {
      const threeMonthsAgo = subMonths(today, 3);
      return {
        from: format(threeMonthsAgo, "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      };
    }
    default:
      return {
        from: format(startOfYear(today), "yyyy-MM-dd"),
        to: format(today, "yyyy-MM-dd"),
      };
  }
};

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
const countWorkingDaysInWeek = (weekStart: Date, weekEnd: Date, rangeFrom: Date, rangeTo: Date): number => {
  // Clamp week to the date range
  const effectiveStart = max([weekStart, rangeFrom]);
  const effectiveEnd = min([weekEnd, rangeTo]);

  if (isBefore(effectiveEnd, effectiveStart)) {
    return 0;
  }

  return countWorkingDays(effectiveStart, effectiveEnd);
};

/**
 * Group time entries by project/task for display
 */
const groupEntriesByProject = (entries: HarvestTimeEntry[]): ProjectEntry[] => {
  const projectMap = new Map<string, { entry: ProjectEntry; rawEntries: HarvestTimeEntry[] }>();

  entries.forEach((entry) => {
    const projectName = entry.project?.name || "Unknown Project";
    const clientName = entry.client?.name || "";
    const taskName = entry.task?.name || "Unknown Task";
    const key = `${projectName}|${clientName}|${taskName}`;

    if (!projectMap.has(key)) {
      projectMap.set(key, {
        entry: {
          projectName,
          clientName,
          taskName,
          dailyHours: {},
          totalHours: 0,
          isAbsence: isAbsenceEntry(entry),
        },
        rawEntries: [],
      });
    }

    const project = projectMap.get(key)!;
    project.rawEntries.push(entry);

    // Add hours to the specific date
    const date = entry.spent_date;
    project.entry.dailyHours[date] = (project.entry.dailyHours[date] || 0) + entry.hours;
    project.entry.totalHours += entry.hours;
  });

  return Array.from(projectMap.values()).map((p) => p.entry);
};

/**
 * Calculate time balance from Harvest time entries
 * All entries (including absence) count towards logged hours.
 * Expected hours are based on working days only (not reduced by absence).
 */
export const calculateTimeBalance = (
  timeEntries: HarvestTimeEntry[],
  dateRange: DateRange
): TimeBalance => {
  const rangeFrom = parseISO(dateRange.from);
  const rangeTo = parseISO(dateRange.to);

  // Group all entries by ISO week
  const weekMap = new Map<string, HarvestTimeEntry[]>();

  timeEntries.forEach((entry) => {
    const entryDate = parseISO(entry.spent_date);

    // Only include entries within the date range
    if (isBefore(entryDate, rangeFrom) || isAfter(entryDate, rangeTo)) {
      return;
    }

    const weekNumber = getISOWeek(entryDate);
    const weekYear = getISOWeekYear(entryDate);
    const weekKey = `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(entry);
  });

  // Get all weeks in the date range (even those without entries)
  const allWeeks = new Set<string>();
  let currentDate = rangeFrom;
  while (!isAfter(currentDate, rangeTo)) {
    const weekNumber = getISOWeek(currentDate);
    const weekYear = getISOWeekYear(currentDate);
    const weekKey = `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
    allWeeks.add(weekKey);
    currentDate = addDays(currentDate, 7);
  }

  // Also add any weeks from entries
  weekMap.forEach((_, key) => allWeeks.add(key));

  // Calculate weekly breakdown
  const sortedWeeks = Array.from(allWeeks).sort();
  let cumulativeBalance = 0;

  const weeklyBreakdown: WeekBalance[] = sortedWeeks.map((weekKey) => {
    // Parse week key to get dates
    const [yearStr, weekStr] = weekKey.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);

    // Get Monday of the week
    const jan4 = new Date(year, 0, 4);
    const monday = startOfISOWeek(jan4);
    const weekStart = addDays(monday, (week - 1) * 7);
    const weekEnd = addDays(weekStart, 4); // Friday

    // Calculate logged hours for this week (ALL entries including absence)
    const entries = weekMap.get(weekKey) || [];
    const logged = entries.reduce((sum, entry) => sum + entry.hours, 0);

    // Calculate Avspasering hours separately (tracked per week, deducted only from total)
    const avspaseringsHours = entries
      .filter(isAvspaseringsEntry)
      .reduce((sum, entry) => sum + entry.hours, 0);

    // Calculate expected hours (working days in this week within range × 8)
    const workingDays = countWorkingDaysInWeek(weekStart, weekEnd, rangeFrom, rangeTo);
    const expected = workingDays * HOURS_PER_DAY;

    // Weekly balance: logged - expected (no avspasering deduction)
    // The weekly view should show the correct 40t/40t = 0t balance
    const balance = logged - expected;
    cumulativeBalance += balance;

    // Group all entries for display (isAbsence flag used for highlighting only)
    const groupedEntries = groupEntriesByProject(entries);

    return {
      weekKey,
      weekStart: format(weekStart, "yyyy-MM-dd"),
      weekEnd: format(weekEnd, "yyyy-MM-dd"),
      logged,
      expected,
      balance,
      cumulativeBalance,
      avspaseringsHours,
      entries: groupedEntries,
    };
  });

  // Calculate totals
  const totalLogged = weeklyBreakdown.reduce((sum, week) => sum + week.logged, 0);
  const totalExpected = weeklyBreakdown.reduce((sum, week) => sum + week.expected, 0);
  const totalAvspaseringsHours = weeklyBreakdown.reduce((sum, week) => sum + week.avspaseringsHours, 0);

  // Total balance: deduct Avspasering from the overall timesaldo
  // Avspasering hours are "time off in lieu" - you're using your banked hours
  const balance = (totalLogged - totalAvspaseringsHours) - totalExpected;

  return {
    totalLogged,
    totalExpected,
    balance,
    weeklyBreakdown,
  };
};

/**
 * Format balance for display with + or - prefix
 */
export const formatBalance = (balance: number, hourSuffix: string = "h"): string => {
  const sign = balance >= 0 ? "+" : "";
  return `${sign}${balance.toFixed(1)}${hourSuffix}`;
};

/**
 * Format week key for display (e.g., "2026-W03" -> "Uke 3" or "Week 3")
 */
export const formatWeekKey = (weekKey: string, weekPrefix: string): string => {
  const match = weekKey.match(/^\d{4}-W(\d{2})$/);
  if (!match) return weekKey;
  const weekNumber = parseInt(match[1], 10);
  return `${weekPrefix} ${weekNumber}`;
};

/**
 * Get CSS class for balance (positive/negative)
 */
export const getBalanceClass = (balance: number): "positive" | "negative" | "neutral" => {
  if (balance > 0.5) return "positive";
  if (balance < -0.5) return "negative";
  return "neutral";
};

/**
 * Get all dates (Mon-Sun) for a week given weekStart (Monday)
 */
export const getWeekDates = (weekStart: string): string[] => {
  const monday = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), "yyyy-MM-dd"));
};

/**
 * Format hours for display (e.g., "8:00" or empty string for 0)
 */
export const formatHoursDisplay = (hours: number): string => {
  if (hours === 0) return "";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}:${minutes.toString().padStart(2, "0")}`;
};

/**
 * Fagtimer (competency hours) calculation
 * Rules: 8 hours per month, except January, December, July, August
 */
const FAGTIMER_CLIENT = "forte digital internal no";
const FAGTIMER_TASK = "competency group participant";
const FAGTIMER_HOURS_PER_MONTH = 8;
const FAGTIMER_EXCLUDED_MONTHS = [0, 6, 7, 11]; // Jan=0, Jul=6, Aug=7, Dec=11

export interface FagtimerBalance {
  used: number;
  available: number;
  percentage: number;
}

/**
 * Check if a time entry is a fagtimer entry
 * Checks both client name and task name (project is "Internal Value", client is "Forte Digital Internal NO")
 */
const isFagtimerEntry = (entry: HarvestTimeEntry): boolean => {
  const clientName = entry.client?.name?.toLowerCase() || "";
  const taskName = entry.task?.name?.toLowerCase() || "";

  return clientName.includes(FAGTIMER_CLIENT) && taskName.includes(FAGTIMER_TASK);
};

/**
 * Calculate available fagtimer hours for a date range
 */
const calculateAvailableFagtimer = (fromDate: Date, toDate: Date): number => {
  let available = 0;
  const currentDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const endDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

  while (currentDate <= endDate) {
    const month = currentDate.getMonth();
    if (!FAGTIMER_EXCLUDED_MONTHS.includes(month)) {
      available += FAGTIMER_HOURS_PER_MONTH;
    }
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return available;
};

/**
 * Calculate fagtimer usage from time entries
 */
export const calculateFagtimerBalance = (
  timeEntries: HarvestTimeEntry[],
  dateRange: DateRange
): FagtimerBalance => {
  const rangeFrom = parseISO(dateRange.from);
  const rangeTo = parseISO(dateRange.to);

  // Calculate used hours from fagtimer entries
  const used = timeEntries
    .filter((entry) => {
      const entryDate = parseISO(entry.spent_date);
      return (
        isFagtimerEntry(entry) &&
        !isBefore(entryDate, rangeFrom) &&
        !isAfter(entryDate, rangeTo)
      );
    })
    .reduce((sum, entry) => sum + entry.hours, 0);

  // Calculate available hours for the date range
  const available = calculateAvailableFagtimer(rangeFrom, rangeTo);

  // Calculate percentage used
  const percentage = available > 0 ? Math.min((used / available) * 100, 100) : 0;

  return { used, available, percentage };
};

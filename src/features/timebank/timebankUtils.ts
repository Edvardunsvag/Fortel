import {
  addDays,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
  isBefore,
  isAfter,
} from "date-fns";
import type { HarvestTimeEntry } from "@/features/lottery/types";
import { detectDailyHourPattern } from "@/features/lottery/lotteryUtils";
import { HARVEST } from "@/shared/constants/harvest";
import {
  ABSENCE_PROJECT_PATTERNS,
  ABSENCE_TASK_PATTERNS,
  matchesAnyPattern,
} from "./constants/absencePatterns";
import {
  getWeekStartFromKey,
  generateWeeksInRange,
  groupEntriesByWeek,
  countWorkingDays,
  calculateWeeklyLogged,
  calculateWeeklyExpected,
  calculateWeeklyBalance,
  calculateBillableHours,
  calculateAvailableForBilling,
} from "./calculations";
import { Timeframe } from "./types";
import type { TimeBalance, WeekBalance, DateRange, ProjectEntry } from "./types";

/**
 * Check if a time entry is an absence entry (vacation, time off, etc.)
 * These are highlighted in the UI but still count towards logged hours
 */
const isAbsenceEntry = (entry: HarvestTimeEntry): boolean => {
  const projectName = entry.project?.name || "";
  const taskName = entry.task?.name || "";

  // Check project name patterns
  if (matchesAnyPattern(projectName, ABSENCE_PROJECT_PATTERNS)) {
    return true;
  }

  // Check task name patterns
  return matchesAnyPattern(taskName, ABSENCE_TASK_PATTERNS);
};

/**
 * Check if a time entry is specifically an Avspasering entry
 * Avspasering hours should be deducted from the time balance
 */
const isAvspaseringsEntry = (entry: HarvestTimeEntry): boolean => {
  const taskName = entry.task?.name?.toLowerCase() || "";
  return taskName.includes(HARVEST.TASKS.AVSPASERING);
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

// Re-export countWorkingDays for backward compatibility
export { countWorkingDays };

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

export interface TimeBankOptions {
  /** User's weekly capacity in seconds (from Harvest API). Default: 144000 (40 hours) */
  weeklyCapacitySeconds?: number;
  /** Whether the user has billable project assignments. Default: true */
  hasBillableProjects?: boolean;
}

/**
 * Calculate Avspasering hours from entries
 */
const calculateAvspaseringsHours = (entries: HarvestTimeEntry[]): number => {
  return entries
    .filter(isAvspaseringsEntry)
    .reduce((sum, entry) => sum + entry.hours, 0);
};

/**
 * Calculate time balance from Harvest time entries
 * All entries (including absence) count towards logged hours.
 * Expected hours are based on working days only (not reduced by absence).
 */
export const calculateTimeBalance = (
  timeEntries: HarvestTimeEntry[],
  dateRange: DateRange,
  options?: TimeBankOptions
): TimeBalance => {
  // Get weekly capacity in hours (convert from seconds)
  const weeklyCapacityHours = options?.weeklyCapacitySeconds
    ? options.weeklyCapacitySeconds / 3600
    : HARVEST.DEFAULTS.WEEKLY_CAPACITY_HOURS;

  // Daily capacity based on user's weekly capacity (divided by 5 work days)
  const dailyCapacityHours = weeklyCapacityHours / 5;

  // Determine if user should have billing expectations
  const hasBillableProjects = options?.hasBillableProjects ?? true;
  const rangeFrom = parseISO(dateRange.from);
  const rangeTo = parseISO(dateRange.to);

  // Detect daily hour pattern (7.5 or 8 hours per day)
  const { dailyTarget } = detectDailyHourPattern(timeEntries);

  // Group entries by week
  const weekMap = groupEntriesByWeek(timeEntries, rangeFrom, rangeTo);

  // Get all weeks in the date range (even those without entries)
  const allWeeks = generateWeeksInRange(rangeFrom, rangeTo);

  // Also add any weeks from entries
  weekMap.forEach((_, key) => allWeeks.add(key));

  // Calculate weekly breakdown
  const sortedWeeks = Array.from(allWeeks).sort();
  let cumulativeBalance = 0;

  const weeklyBreakdown: WeekBalance[] = sortedWeeks.map((weekKey) => {
    const weekStart = getWeekStartFromKey(weekKey);
    const weekEnd = addDays(weekStart, 4); // Friday

    // Get entries for this week
    const entries = weekMap.get(weekKey) || [];

    // Calculate metrics using extracted functions
    const logged = calculateWeeklyLogged(entries);
    const expected = calculateWeeklyExpected(weekStart, rangeFrom, rangeTo, dailyCapacityHours);
    const billableHours = calculateBillableHours(entries);
    const avspaseringsHours = calculateAvspaseringsHours(entries);
    const availableForBilling = calculateAvailableForBilling(
      weekStart,
      rangeFrom,
      rangeTo,
      dailyTarget,
      billableHours,
      hasBillableProjects
    );

    // Weekly balance: logged - expected (no avspasering deduction)
    const balance = calculateWeeklyBalance(logged, expected);
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
      billableHours,
      availableForBilling,
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
export interface FagtimerBalance {
  used: number;
  available: number;
  percentage: number;
}

/**
 * Check if a time entry is a fagtimer entry
 */
const isFagtimerEntry = (entry: HarvestTimeEntry): boolean => {
  const clientName = entry.client?.name?.toLowerCase() || "";
  const taskName = entry.task?.name?.toLowerCase() || "";

  return (
    clientName.includes(HARVEST.FAGTIMER_CLIENT) &&
    taskName.includes(HARVEST.TASKS.FAGTIMER)
  );
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
    if (!(HARVEST.FAGTIMER_EXCLUDED_MONTHS as readonly number[]).includes(month)) {
      available += HARVEST.DEFAULTS.FAGTIMER_HOURS_PER_MONTH;
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

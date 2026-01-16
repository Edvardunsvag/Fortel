import { useMemo } from "react";
import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays, format } from "date-fns";
import type { HarvestTimeEntry } from "./types";
import { checkLotteryEligibility, detectDailyHourPattern } from "./lotteryUtils";

export interface WeeklyData {
  weekKey: string; // e.g., "2024-W01"
  weekStart: string; // e.g., "2024-01-01" (Monday)
  weekEnd: string; // e.g., "2024-01-05" (Friday)
  entries: HarvestTimeEntry[];
  hours: number;
  billableHours: number; // Hours at client (entries with client !== null)
  possibleOvertimeHours: number; // weeklyTarget - billableHours (min 0)
  weeklyTarget: 37.5 | 40; // Target hours based on detected pattern
  isLotteryEligible: boolean;
  lotteryReason?: string;
  lotteryReasonKey?: "missingHours" | "entriesUpdatedAfterDeadline";
  lotteryReasonData?: {
    missingDays?: string[];
    latestUpdate?: string;
  };
}

/**
 * Hook to group time entries by ISO week
 * @param timeEntries - Array of time entries to group
 * @returns Array of weekly data objects, sorted by week (newest first)
 */
export const useGroupEntriesByWeek = (timeEntries: HarvestTimeEntry[]): WeeklyData[] => {
  return useMemo(() => {
    // Detect pattern from all time entries first
    const { weeklyTarget } = detectDailyHourPattern(timeEntries);

    const weeks: { [key: string]: HarvestTimeEntry[] } = {};

    // Group entries by week
    timeEntries.forEach((entry) => {
      // Parse the spent_date (YYYY-MM-DD format)
      const [year, month, day] = entry.spent_date.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      // Get ISO week number and year (handles year boundaries correctly)
      const weekNumber = getISOWeek(date);
      const weekYear = getISOWeekYear(date);

      // Create a unique key for this week: "2024-W01" format
      const weekKey = `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(entry);
    });

    // Sort weeks by year and week number (newest first) and map to WeeklyData
    return Object.entries(weeks)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, entries]) => {
        // Get Monday of the week from any entry in this week
        const [year, month, day] = entries[0].spent_date.split("-").map(Number);
        const sampleDate = new Date(year, month - 1, day);
        const monday = startOfISOWeek(sampleDate);
        const friday = addDays(monday, 4);

        // Format dates as YYYY-MM-DD
        const weekStart = format(monday, "yyyy-MM-dd");
        const weekEnd = format(friday, "yyyy-MM-dd");

        const weekHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

        // Calculate billable hours (entries with client !== null)
        const billableHours = entries
          .filter((entry) => entry.client !== null)
          .reduce((sum, entry) => sum + entry.hours, 0);

        // Calculate possible overtime hours (weeklyTarget - billableHours, min 0)
        const possibleOvertimeHours = Math.max(0, weeklyTarget - billableHours);

        // Check lottery eligibility
        const lotteryCheck = checkLotteryEligibility(entries, weekEnd);

        return {
          weekKey,
          weekStart,
          weekEnd,
          entries,
          hours: weekHours,
          billableHours,
          possibleOvertimeHours,
          weeklyTarget,
          isLotteryEligible: lotteryCheck.isEligible,
          lotteryReason: lotteryCheck.reason,
          lotteryReasonKey: lotteryCheck.reasonKey,
          lotteryReasonData: lotteryCheck.reasonData,
        };
      });
  }, [timeEntries]);
};

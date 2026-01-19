import { parseISO, isBefore, isAfter } from "date-fns";
import type { HarvestTimeEntry } from "@/features/lottery/types";
import { createWeekKey } from "./weekUtils";

/**
 * Filter entries that fall within a date range
 */
export const filterEntriesInDateRange = (
  entries: HarvestTimeEntry[],
  rangeFrom: Date,
  rangeTo: Date
): HarvestTimeEntry[] => {
  return entries.filter((entry) => {
    const entryDate = parseISO(entry.spent_date);
    return !isBefore(entryDate, rangeFrom) && !isAfter(entryDate, rangeTo);
  });
};

/**
 * Group time entries by ISO week
 */
export const groupEntriesByWeek = (
  entries: HarvestTimeEntry[],
  rangeFrom: Date,
  rangeTo: Date
): Map<string, HarvestTimeEntry[]> => {
  const weekMap = new Map<string, HarvestTimeEntry[]>();

  entries.forEach((entry) => {
    const entryDate = parseISO(entry.spent_date);

    // Only include entries within the date range
    if (isBefore(entryDate, rangeFrom) || isAfter(entryDate, rangeTo)) {
      return;
    }

    const weekKey = createWeekKey(entryDate);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(entry);
  });

  return weekMap;
};

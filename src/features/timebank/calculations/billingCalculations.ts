import { addDays } from "date-fns";
import type { HarvestTimeEntry } from "@/features/lottery/types";
import { HARVEST } from "@/shared/constants/harvest";
import { countWorkingDaysInWeek } from "./balanceCalculations";

/**
 * Check if an entry is from an internal client (non-billable)
 */
export const isInternalClient = (clientName: string | null | undefined): boolean => {
  return clientName?.toLowerCase().includes(HARVEST.CLIENTS.INTERNAL) ?? false;
};

/**
 * Calculate billable hours from entries (entries with external client)
 */
export const calculateBillableHours = (entries: HarvestTimeEntry[]): number => {
  return entries
    .filter((entry) => {
      if (!entry.client) return false;
      return !isInternalClient(entry.client.name);
    })
    .reduce((sum, entry) => sum + entry.hours, 0);
};

/**
 * Calculate "available for billing" hours for a week
 * This shows the difference between billing target and actual billable hours
 */
export const calculateAvailableForBilling = (
  weekStart: Date,
  rangeFrom: Date,
  rangeTo: Date,
  dailyTarget: number,
  billableHours: number,
  hasBillableProjects: boolean
): number => {
  if (!hasBillableProjects) {
    return 0;
  }

  const weekEnd = addDays(weekStart, 4); // Friday
  const workingDays = countWorkingDaysInWeek(weekStart, weekEnd, rangeFrom, rangeTo);
  const weeklyBillingTarget = workingDays * dailyTarget;

  return weeklyBillingTarget - billableHours;
};

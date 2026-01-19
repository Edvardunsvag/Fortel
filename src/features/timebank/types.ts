export enum Timeframe {
  YearToDate = "yearToDate",
  ThisMonth = "thisMonth",
  Rolling3Months = "rolling3Months",
  Custom = "custom",
}

export interface DailyHours {
  [date: string]: number; // YYYY-MM-DD -> hours
}

export interface ProjectEntry {
  projectName: string;
  clientName: string;
  taskName: string;
  dailyHours: DailyHours;
  totalHours: number;
  isAbsence: boolean;
}

export interface WeekBalance {
  weekKey: string; // "2026-W03"
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Friday)
  logged: number;
  expected: number; // 40 or prorated for partial weeks
  balance: number; // (logged - avspasering) - expected
  cumulativeBalance: number; // Running total
  avspaseringsHours: number; // Hours taken as time off in lieu (deducted from balance)
  billableHours: number; // Hours at client (entries with client !== null)
  availableForBilling: number; // weeklyTarget - billableHours (hours available to bill)
  entries: ProjectEntry[]; // Grouped by project/task for display
}

export interface TimeBalance {
  totalLogged: number; // Total hours from Harvest
  totalExpected: number; // Working days × 8
  balance: number; // logged - expected (+/-)
  weeklyBreakdown: WeekBalance[];
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

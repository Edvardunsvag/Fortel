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
  balance: number; // logged - expected
  cumulativeBalance: number; // Running total
  
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

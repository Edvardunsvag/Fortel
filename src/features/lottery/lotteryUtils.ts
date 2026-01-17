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

/**
 * Check if a user is eligible for a lottery ticket based on their time entries
 *
 * Eligibility criteria:
 * - Must have at least 8 hours logged for each day Monday-Friday
 * - All time entries for the week must be created AND updated before Friday 15:00
 *   (No updates allowed after the deadline - entries must be completely finalized)
 *
 * @param timeEntries - Array of time entries for the week
 * @param fridayDate - The date of the Friday to check against (YYYY-MM-DD format)
 * @param timezone - Optional timezone (defaults to UTC). Should match user's timezone from Harvest
 * @returns Object with eligibility status and details
 */
export interface LotteryEligibilityResult {
  isEligible: boolean;
  reason?: string;
  reasonKey?: "missingHours" | "entriesUpdatedAfterDeadline";
  reasonData?: {
    missingDays?: string[];
    latestUpdate?: string;
  };
  dailyHours: {
    date: string;
    hours: number;
    meetsRequirement: boolean;
    lastUpdated: string | null;
  }[];
  cutoffTime: Date;
  latestEntryTime: Date | null;
}

export const checkLotteryEligibility = (
  timeEntries: HarvestTimeEntry[],
  fridayDate: string // YYYY-MM-DD format
): LotteryEligibilityResult => {
  // Parse Friday date using local date constructor to avoid timezone issues
  const [year, month, day] = fridayDate.split("-").map(Number);
  const friday = new Date(year, month - 1, day);

  if (isNaN(friday.getTime())) {
    return {
      isEligible: false,
      reason: "Invalid Friday date",
      dailyHours: [],
      cutoffTime: new Date(),
      latestEntryTime: null,
    };
  }

  // Ensure it's actually a Friday
  if (friday.getDay() !== 5) {
    return {
      isEligible: false,
      reason: "Provided date is not a Friday",
      dailyHours: [],
      cutoffTime: new Date(),
      latestEntryTime: null,
    };
  }

  // Set cutoff time to Friday 15:00 (3 PM) in local time
  const cutoffTime = new Date(friday);
  cutoffTime.setHours(15, 0, 0, 0);

  // If timezone is provided, we need to convert to UTC for comparison
  // For simplicity, we'll assume the cutoffTime is already in the correct timezone
  // In production, you'd want to use a library like date-fns-tz or moment-timezone

  // Get the week (Monday to Friday)
  const monday = new Date(friday);
  monday.setDate(friday.getDate() - 4); // Go back 4 days to get Monday

  // Helper to format date as YYYY-MM-DD using local components
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Group entries by date and calculate daily hours
  const dailyHoursMap = new Map<string, { hours: number; lastUpdated: Date | null }>();

  // Initialize all weekdays with 0 hours
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = formatDate(date);
    dailyHoursMap.set(dateKey, { hours: 0, lastUpdated: null });
  }

  let latestEntryTime: Date | null = null;

  // Process each time entry
  for (const entry of timeEntries) {
    // Parse spent_date as local date to avoid timezone issues
    const [entryYear, entryMonth, entryDay] = entry.spent_date.split("-").map(Number);
    const entryDate = new Date(entryYear, entryMonth - 1, entryDay);
    const dateKey = entry.spent_date;

    // Only process entries from Monday-Friday of this week
    // Compare dates by comparing their time values (midnight)
    const mondayMidnight = new Date(monday).setHours(0, 0, 0, 0);
    const fridayMidnight = new Date(friday).setHours(23, 59, 59, 999);
    const entryMidnight = entryDate.setHours(0, 0, 0, 0);
    const entryDayOfWeek = entryDate.getDay();

    if (
      entryMidnight >= mondayMidnight &&
      entryMidnight <= fridayMidnight &&
      entryDayOfWeek >= 1 &&
      entryDayOfWeek <= 5
    ) {
      const existing = dailyHoursMap.get(dateKey) || { hours: 0, lastUpdated: null };
      existing.hours += entry.hours;

      // Track the most recent timestamp (created_at or updated_at)
      // Both must be before the deadline - we use the later of the two to ensure
      // the entry was completely finalized before the cutoff time
      const created = new Date(entry.created_at);
      const updated = new Date(entry.updated_at);
      const entryLatest = created > updated ? created : updated;

      if (!existing.lastUpdated || entryLatest > existing.lastUpdated) {
        existing.lastUpdated = entryLatest;
      }

      if (!latestEntryTime || entryLatest > latestEntryTime) {
        latestEntryTime = entryLatest;
      }

      dailyHoursMap.set(dateKey, existing);
    }
  }

  // Check eligibility
  const dailyHours: LotteryEligibilityResult["dailyHours"] = [];
  let allDaysMeetRequirement = true;
  let allEntriesBeforeCutoff = true;

  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = formatDate(date);
    const dayData = dailyHoursMap.get(dateKey) || { hours: 0, lastUpdated: null };

    const meetsRequirement = dayData.hours >= 8;
    if (!meetsRequirement) {
      allDaysMeetRequirement = false;
    }

    // Check if this day's entries were finalized (created AND updated) before cutoff
    // The lastUpdated timestamp is the later of created_at or updated_at
    // This ensures no updates occurred after the deadline
    if (dayData.lastUpdated && dayData.lastUpdated > cutoffTime) {
      allEntriesBeforeCutoff = false;
    }

    dailyHours.push({
      date: dateKey,
      hours: dayData.hours,
      meetsRequirement,
      lastUpdated: dayData.lastUpdated?.toISOString() || null,
    });
  }

  // Check if latest entry overall is before cutoff
  if (latestEntryTime && latestEntryTime > cutoffTime) {
    allEntriesBeforeCutoff = false;
  }

  const isEligible = allDaysMeetRequirement && allEntriesBeforeCutoff;

  let reason: string | undefined;
  let reasonKey: "missingHours" | "entriesUpdatedAfterDeadline" | undefined;
  let reasonData: { missingDays?: string[]; latestUpdate?: string } | undefined;

  if (!isEligible) {
    if (!allDaysMeetRequirement) {
      const missingDays = dailyHours.filter((d) => !d.meetsRequirement).map((d) => d.date);
      reasonKey = "missingHours";
      reasonData = { missingDays };
      // Keep backward compatibility with plain string
      reason = `Missing 8 hours on: ${missingDays.join(", ")}`;
    } else if (!allEntriesBeforeCutoff) {
      const latestTime = latestEntryTime?.toISOString() || "unknown";
      reasonKey = "entriesUpdatedAfterDeadline";
      reasonData = { latestUpdate: latestTime };
      // Keep backward compatibility with plain string
      reason = `Some entries were updated after Friday 15:00. Latest update: ${latestTime}`;
    }
  }

  return {
    isEligible,
    reason,
    reasonKey,
    reasonData,
    dailyHours,
    cutoffTime,
    latestEntryTime,
  };
};

/**
 * Get the current week's Friday date (YYYY-MM-DD format)
 */
export const getCurrentWeekFriday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday);
  return friday.toISOString().split("T")[0];
};

/**
 * Get the previous week's Friday date (YYYY-MM-DD format)
 */
export const getPreviousWeekFriday = (): string => {
  const friday = new Date(getCurrentWeekFriday());
  friday.setDate(friday.getDate() - 7);
  return friday.toISOString().split("T")[0];
};

/**
 * Get the next lottery date (first Friday after month change)
 * The lottery always happens on the first Friday after a month change
 * @returns Friday date in YYYY-MM-DD format
 */
export const getNextLotteryDate = (): string => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of next month
  const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

  // Find the first Friday in or after the first day of next month
  const dayOfWeek = firstDayOfNextMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to add to get to Friday
  // Friday is day 5 (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
  let daysToFriday: number;
  if (dayOfWeek <= 5) {
    // Sunday-Friday: calculate days to Friday
    // If it's Friday (5), add 0 days. If it's Thursday (4), add 1 day, etc.
    daysToFriday = 5 - dayOfWeek;
  } else {
    // Saturday (6): go to next Friday (6 days forward)
    daysToFriday = 6;
  }

  const friday = new Date(firstDayOfNextMonth);
  friday.setDate(firstDayOfNextMonth.getDate() + daysToFriday);
  // Set time to 15:00 (3 PM) - the cutoff time
  friday.setHours(15, 0, 0, 0);

  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return formatDate(friday);
};

/**
 * Get the next lottery date as a Date object (with time set to 15:00)
 * @returns Date object for the next lottery Friday at 15:00
 */
export const getNextLotteryDateTime = (): Date => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of next month
  const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

  // Find the first Friday in or after the first day of next month
  const dayOfWeek = firstDayOfNextMonth.getDay();

  let daysToFriday: number;
  if (dayOfWeek <= 5) {
    daysToFriday = 5 - dayOfWeek;
  } else {
    daysToFriday = 6;
  }

  const friday = new Date(firstDayOfNextMonth);
  friday.setDate(firstDayOfNextMonth.getDate() + daysToFriday);
  friday.setHours(15, 0, 0, 0);

  return friday;
};

/**
 * Get the next Friday at 15:00 (not necessarily the lottery date)
 * If today is Friday and it's before 15:00, returns today at 15:00
 * Otherwise, returns the next Friday at 15:00
 * @returns Date object for the next Friday at 15:00
 */
export const getNextFridayAt15 = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
  const currentHour = today.getHours();

  // Calculate days until next Friday
  let daysToFriday: number;
  if (dayOfWeek < 5) {
    // Sunday-Thursday: calculate days to Friday
    daysToFriday = 5 - dayOfWeek;
  } else if (dayOfWeek === 5) {
    // Today is Friday
    if (currentHour < 15) {
      // Before 15:00, return today at 15:00
      daysToFriday = 0;
    } else {
      // At or after 15:00, return next Friday
      daysToFriday = 7;
    }
  } else {
    // Saturday: next Friday is 6 days away
    daysToFriday = 6;
  }

  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysToFriday);
  nextFriday.setHours(15, 0, 0, 0);

  return nextFriday;
};

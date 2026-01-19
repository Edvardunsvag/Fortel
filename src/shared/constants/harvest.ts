/**
 * Harvest-related constants
 * Centralized magic strings for Harvest integration
 */
export const HARVEST = {
  /** Client name patterns */
  CLIENTS: {
    /** Internal client name pattern (non-billable) */
    INTERNAL: "forte digital internal",
  },

  /** Task name patterns */
  TASKS: {
    /** Competency group participant task */
    FAGTIMER: "competency group participant",
    /** Time off in lieu */
    AVSPASERING: "avspasering",
  },

  /** Default values */
  DEFAULTS: {
    /** Default weekly capacity in hours */
    WEEKLY_CAPACITY_HOURS: 40,
    /** Default daily capacity in hours (weekly / 5) */
    DAILY_CAPACITY_HOURS: 8,
    /** Fagtimer hours allowed per month */
    FAGTIMER_HOURS_PER_MONTH: 8,
  },

  /** Fagtimer client (full name for exact matching) */
  FAGTIMER_CLIENT: "forte digital internal no",

  /** Months excluded from fagtimer calculation (0-indexed) */
  FAGTIMER_EXCLUDED_MONTHS: [0, 6, 7, 11], // Jan, Jul, Aug, Dec
} as const;

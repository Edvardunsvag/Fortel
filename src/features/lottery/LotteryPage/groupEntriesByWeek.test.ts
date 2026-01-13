import { describe, it, expect } from "vitest";
import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays, format } from "date-fns";
import type { HarvestTimeEntry } from "../types";

/**
 * Helper function to test the week grouping logic
 * This mirrors the logic from groupEntriesByWeek in LotteryPage.tsx
 */
function getWeekKeyForDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekNumber = getISOWeek(date);
  const weekYear = getISOWeekYear(date);
  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
}

function getMondayForDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monday = startOfISOWeek(date);
  return format(monday, "yyyy-MM-dd");
}

function getFridayForWeek(mondayString: string): string {
  const [year, month, day] = mondayString.split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  const friday = addDays(monday, 4);
  return format(friday, "yyyy-MM-dd");
}

describe("Week grouping logic", () => {
  describe("getWeekKeyForDate", () => {
    it("should return correct week key for dates in same week", () => {
      // All dates in week 1 of 2024 should have same week key
      expect(getWeekKeyForDate("2024-01-01")).toBe(getWeekKeyForDate("2024-01-05"));
      expect(getWeekKeyForDate("2024-01-01")).toBe(getWeekKeyForDate("2024-01-03"));
    });

    it("should return different week keys for different weeks", () => {
      const week1 = getWeekKeyForDate("2024-01-01");
      const week2 = getWeekKeyForDate("2024-01-08");
      expect(week1).not.toBe(week2);
    });
  });

  describe("getMondayForDate", () => {
    it("should return the same date for Monday", () => {
      // 2024-01-01 is a Monday
      expect(getMondayForDate("2024-01-01")).toBe("2024-01-01");
    });

    it("should return Monday for Tuesday", () => {
      // 2024-01-02 is a Tuesday
      expect(getMondayForDate("2024-01-02")).toBe("2024-01-01");
    });

    it("should return Monday for Wednesday", () => {
      // 2024-01-03 is a Wednesday
      expect(getMondayForDate("2024-01-03")).toBe("2024-01-01");
    });

    it("should return Monday for Thursday", () => {
      // 2024-01-04 is a Thursday
      expect(getMondayForDate("2024-01-04")).toBe("2024-01-01");
    });

    it("should return Monday for Friday", () => {
      // 2024-01-05 is a Friday
      expect(getMondayForDate("2024-01-05")).toBe("2024-01-01");
    });

    it("should return Monday for Saturday", () => {
      // 2024-01-06 is a Saturday
      expect(getMondayForDate("2024-01-06")).toBe("2024-01-01");
    });

    it("should return previous Monday for Sunday", () => {
      // 2024-01-07 is a Sunday, should return 2024-01-01 (previous Monday)
      expect(getMondayForDate("2024-01-07")).toBe("2024-01-01");
    });

    it("should handle Sunday at month boundary", () => {
      // 2024-01-14 is a Sunday, should return 2024-01-08 (previous Monday)
      expect(getMondayForDate("2024-01-14")).toBe("2024-01-08");
    });

    it("should handle dates across month boundaries", () => {
      // 2024-01-31 is a Wednesday, should return 2024-01-29 (Monday)
      expect(getMondayForDate("2024-01-31")).toBe("2024-01-29");
    });
  });

  describe("getFridayForWeek", () => {
    it("should return Friday (Monday + 4 days)", () => {
      // Monday 2024-01-01 + 4 days = Friday 2024-01-05
      expect(getFridayForWeek("2024-01-01")).toBe("2024-01-05");
    });

    it("should handle week across month boundary", () => {
      // Monday 2024-01-29 + 4 days = Friday 2024-02-02
      expect(getFridayForWeek("2024-01-29")).toBe("2024-02-02");
    });
  });

  describe("Complete week grouping", () => {
    it("should group entries from same week together", () => {
      const entries: HarvestTimeEntry[] = [
        {
          id: 1,
          spent_date: "2024-01-01", // Monday
          hours: 8,
        } as HarvestTimeEntry,
        {
          id: 2,
          spent_date: "2024-01-03", // Wednesday
          hours: 6,
        } as HarvestTimeEntry,
        {
          id: 3,
          spent_date: "2024-01-05", // Friday
          hours: 7,
        } as HarvestTimeEntry,
      ];

      const weeks: { [key: string]: HarvestTimeEntry[] } = {};
      entries.forEach((entry) => {
        const weekKey = getWeekKeyForDate(entry.spent_date);
        if (!weeks[weekKey]) {
          weeks[weekKey] = [];
        }
        weeks[weekKey].push(entry);
      });

      // All entries should be in the same week (2024-W01)
      expect(Object.keys(weeks)).toHaveLength(1);
      const weekKey = getWeekKeyForDate("2024-01-01");
      expect(weeks[weekKey]).toHaveLength(3);
    });

    it("should separate entries from different weeks", () => {
      const entries: HarvestTimeEntry[] = [
        {
          id: 1,
          spent_date: "2024-01-05", // Friday (week starting 2024-01-01)
          hours: 8,
        } as HarvestTimeEntry,
        {
          id: 2,
          spent_date: "2024-01-08", // Monday (week starting 2024-01-08)
          hours: 6,
        } as HarvestTimeEntry,
        {
          id: 3,
          spent_date: "2024-01-12", // Friday (week starting 2024-01-08)
          hours: 7,
        } as HarvestTimeEntry,
      ];

      const weeks: { [key: string]: HarvestTimeEntry[] } = {};
      entries.forEach((entry) => {
        const weekKey = getWeekKeyForDate(entry.spent_date);
        if (!weeks[weekKey]) {
          weeks[weekKey] = [];
        }
        weeks[weekKey].push(entry);
      });

      // Should have 2 weeks
      expect(Object.keys(weeks)).toHaveLength(2);
      const week1Key = getWeekKeyForDate("2024-01-05");
      const week2Key = getWeekKeyForDate("2024-01-08");
      expect(weeks[week1Key]).toHaveLength(1);
      expect(weeks[week2Key]).toHaveLength(2);
    });
  });
});

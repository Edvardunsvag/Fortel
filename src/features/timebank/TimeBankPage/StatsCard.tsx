import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { WeekBalance } from "../types";
import styles from "./TimeBankPage.module.scss";

interface StatsCardProps {
  weeks: WeekBalance[];
}

export const StatsCard = ({ weeks }: StatsCardProps) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (weeks.length === 0) {
      return {
        avgHoursPerWeek: 0,
        mostActiveProject: null,
        trend: "neutral" as const,
        trendPercentage: 0,
      };
    }

    // Average hours per week
    const totalLogged = weeks.reduce((sum, w) => sum + w.logged, 0);
    const avgHoursPerWeek = totalLogged / weeks.length;

    // Most active project
    const projectMap = new Map<string, number>();
    weeks.forEach((week) => {
      week.entries.forEach((entry) => {
        if (entry.isAbsence) return;
        const current = projectMap.get(entry.projectName) || 0;
        projectMap.set(entry.projectName, current + entry.totalHours);
      });
    });

    // Find project with most hours
    const projectEntries = Array.from(projectMap.entries());
    const mostActive = projectEntries.reduce<{ name: string; hours: number } | null>(
      (max, [name, hours]) => (!max || hours > max.hours ? { name, hours } : max),
      null
    );
    const mostActiveProject = mostActive?.name ?? null;

    // Trend calculation (compare last half to first half)
    let trend: "up" | "down" | "neutral" = "neutral";
    let trendPercentage = 0;

    if (weeks.length >= 2) {
      const midpoint = Math.floor(weeks.length / 2);
      const firstHalf = weeks.slice(0, midpoint);
      const secondHalf = weeks.slice(midpoint);

      const firstHalfAvg = firstHalf.reduce((sum, w) => sum + w.balance, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, w) => sum + w.balance, 0) / secondHalf.length;

      if (secondHalfAvg > firstHalfAvg + 0.5) {
        trend = "up";
        trendPercentage = firstHalfAvg !== 0 ? ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100 : 100;
      } else if (secondHalfAvg < firstHalfAvg - 0.5) {
        trend = "down";
        trendPercentage = firstHalfAvg !== 0 ? ((firstHalfAvg - secondHalfAvg) / Math.abs(firstHalfAvg)) * 100 : 100;
      }
    }

    return {
      avgHoursPerWeek,
      mostActiveProject,
      trend,
      trendPercentage: Math.min(Math.abs(trendPercentage), 999),
    };
  }, [weeks]);

  if (weeks.length === 0) {
    return null;
  }

  return (
    <div className={styles.statsCard}>
      <h3 className={styles.statsCardTitle}>{t("timebank.stats.title")}</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>
            {stats.avgHoursPerWeek.toFixed(1)}{t("timebank.hourSuffix")}
          </div>
          <div className={styles.statLabel}>{t("timebank.stats.avgPerWeek")}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statValue}>
            {stats.trend === "up" && <span className={styles.trendUp}>↑</span>}
            {stats.trend === "down" && <span className={styles.trendDown}>↓</span>}
            {stats.trend === "neutral" && <span className={styles.trendNeutral}>→</span>}
          </div>
          <div className={styles.statLabel}>{t("timebank.stats.trend")}</div>
        </div>

        {stats.mostActiveProject && (
          <div className={styles.statItem}>
            <div className={styles.statValueSmall} title={stats.mostActiveProject}>
              {stats.mostActiveProject.length > 20
                ? `${stats.mostActiveProject.substring(0, 18)}...`
                : stats.mostActiveProject}
            </div>
            <div className={styles.statLabel}>{t("timebank.stats.topProject")}</div>
          </div>
        )}
      </div>
    </div>
  );
};

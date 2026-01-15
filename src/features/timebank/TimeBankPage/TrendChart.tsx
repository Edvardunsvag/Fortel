import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { WeekBalance } from "../types";
import { formatWeekKey } from "../timebankUtils";
import styles from "./TimeBankPage.module.scss";

interface TrendChartProps {
  weeks: WeekBalance[];
}

export const TrendChart = ({ weeks }: TrendChartProps) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (weeks.length === 0) return { points: [], minBalance: 0, maxBalance: 0, range: 1 };

    const balances = weeks.map((w) => w.cumulativeBalance);
    const minBalance = Math.min(...balances, 0);
    const maxBalance = Math.max(...balances, 0);
    const range = Math.max(Math.abs(maxBalance - minBalance), 1);

    // Calculate points for the line chart
    const points = weeks.map((week, index) => {
      const x = (index / Math.max(weeks.length - 1, 1)) * 100;
      // Normalize to 0-100 range, with 0 balance at middle if range spans both positive and negative
      const normalizedY = ((week.cumulativeBalance - minBalance) / range) * 100;
      return { x, y: 100 - normalizedY, week }; // Invert Y since SVG y-axis is top-down
    });

    return { points, minBalance, maxBalance, range };
  }, [weeks]);

  if (weeks.length < 2) {
    return null;
  }

  const { points, minBalance, maxBalance } = chartData;

  // Create SVG path for the line
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Create area path (filled area under the line)
  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

  // Calculate zero line position
  const zeroLineY = maxBalance <= 0 ? 0 : minBalance >= 0 ? 100 : (maxBalance / (maxBalance - minBalance)) * 100;

  return (
    <div className={styles.trendChart}>
      <h3 className={styles.trendChartTitle}>{t("timebank.trendChart.title")}</h3>
      <div className={styles.trendChartContainer}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.trendChartSvg}>
          {/* Zero line */}
          <line x1="0" y1={zeroLineY} x2="100" y2={zeroLineY} className={styles.trendChartZeroLine} />

          {/* Area fill */}
          <path d={areaPath} className={styles.trendChartArea} />

          {/* Line */}
          <path d={linePath} className={styles.trendChartLine} fill="none" />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="2"
              className={styles.trendChartPoint}
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className={styles.trendChartLabels}>
          {points.length > 0 && (
            <>
              <span>{formatWeekKey(points[0].week.weekKey, t("timebank.weekPrefix"))}</span>
              <span>{formatWeekKey(points[points.length - 1].week.weekKey, t("timebank.weekPrefix"))}</span>
            </>
          )}
        </div>

        {/* Y-axis labels */}
        <div className={styles.trendChartYLabels}>
          <span>+{maxBalance.toFixed(0)}{t("timebank.hourSuffix")}</span>
          <span>{minBalance.toFixed(0)}{t("timebank.hourSuffix")}</span>
        </div>
      </div>
    </div>
  );
};

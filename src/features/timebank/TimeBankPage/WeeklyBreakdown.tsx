import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import type { WeekBalance } from "../types";
import { formatBalance, getBalanceClass, getWeekDates, formatHoursDisplay } from "../timebankUtils";
import styles from "./TimeBankPage.module.scss";

interface WeeklyBreakdownProps {
  weeks: WeekBalance[];
}

export const WeeklyBreakdown = ({ weeks }: WeeklyBreakdownProps) => {
  const { t } = useTranslation();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const getBalanceColorClass = (balance: number) => {
    const balanceClass = getBalanceClass(balance);
    return balanceClass === "positive"
      ? styles.positive
      : balanceClass === "negative"
        ? styles.negative
        : styles.neutral;
  };

  const handleWeekClick = (weekKey: string) => {
    setExpandedWeek(expandedWeek === weekKey ? null : weekKey);
  };

  const formatDayHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    const dayName = format(date, "EEE");
    const dayDate = format(date, "dd MMM");
    return { dayName, dayDate };
  };

  // Show weeks in reverse order (newest first)
  const sortedWeeks = [...weeks].reverse();

  return (
    <div className={styles.weeklyBreakdown}>
      <h3 className={styles.weeklyBreakdownTitle}>{t("timebank.weeklyBreakdown")}</h3>
      <div className={styles.weeksList}>
        {sortedWeeks.map((week) => {
          const isExpanded = expandedWeek === week.weekKey;
          const weekDates = getWeekDates(week.weekStart);

          return (
            <div key={week.weekKey} className={styles.week}>
              <div
                className={styles.weekHeader}
                onClick={() => handleWeekClick(week.weekKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleWeekClick(week.weekKey);
                  }
                }}
              >
                <div className={styles.weekHeaderContent}>
                  <h4 className={styles.weekTitle}>{week.weekKey}</h4>
                  <div className={styles.weekStats}>
                    <span className={styles.weekHours}>
                      {week.logged.toFixed(1)}h / {week.expected.toFixed(1)}h
                    </span>
                    <span className={`${styles.weekBalance} ${getBalanceColorClass(week.balance)}`}>
                      {formatBalance(week.balance)}
                    </span>
                    <span className={styles.weekCumulative}>
                      ({formatBalance(week.cumulativeBalance)})
                    </span>
                  </div>
                </div>
                <span className={`${styles.weekChevron} ${isExpanded ? styles.weekChevronOpen : ""}`}>
                  ▼
                </span>
              </div>

              <div className={`${styles.weekContent} ${isExpanded ? styles.weekContentOpen : ""}`}>
                <div className={styles.weekContentInner}>
                  <div className={styles.weekDetails}>
                    <table className={styles.detailsTable}>
                      <thead>
                        <tr>
                          <th className={styles.projectHeader}>{t("timebank.project")}</th>
                          {weekDates.map((date) => {
                            const { dayName, dayDate } = formatDayHeader(date);
                            return (
                              <th key={date} className={styles.dayHeader}>
                                <span className={styles.dayName}>{dayName}</span>
                                <span className={styles.dayDate}>{dayDate}</span>
                              </th>
                            );
                          })}
                          <th className={styles.totalHeader}>{t("timebank.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {week.entries.map((entry, idx) => (
                          <tr
                            key={`${entry.projectName}-${entry.taskName}-${idx}`}
                            className={entry.isAbsence ? styles.absenceRow : ""}
                          >
                            <td className={styles.projectCell}>
                              <div className={styles.projectName}>
                                {entry.projectName}
                                {entry.clientName && ` (${entry.clientName})`}
                              </div>
                              <div className={styles.taskName}>{entry.taskName}</div>
                            </td>
                            {weekDates.map((date) => (
                              <td key={date} className={styles.hoursCell}>
                                {formatHoursDisplay(entry.dailyHours[date] || 0)}
                              </td>
                            ))}
                            <td className={styles.totalCell}>
                              {formatHoursDisplay(entry.totalHours)}
                            </td>
                          </tr>
                        ))}
                        {week.entries.length === 0 && (
                          <tr>
                            <td colSpan={9} className={styles.noEntries}>
                              {t("timebank.noEntries")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

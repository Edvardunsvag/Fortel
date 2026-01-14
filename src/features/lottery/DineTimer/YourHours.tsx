import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLotteryTimeEntries } from "../queries";
import { useGroupEntriesByWeek } from "../useGroupEntriesByWeek";
import { formatDateReadable } from "@/shared/utils/dateUtils";
import styles from "./YourHours.module.scss";
import { FROM_DATE, TO_DATE } from "../consts";

interface YourHoursProps {
  isAuthenticated: boolean;
  error?: string;
}

export const YourHours = ({ isAuthenticated, error }: YourHoursProps) => {
  const { t } = useTranslation();
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());

  const { data: timeEntries = [], error: entriesError } = useLotteryTimeEntries(
    FROM_DATE,
    TO_DATE,
    isAuthenticated && !!FROM_DATE && !!TO_DATE
  );

  const displayError = error || entriesError?.message;

  const toggleWeek = (weekStart: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) {
        next.delete(weekStart);
      } else {
        next.add(weekStart);
      }
      return next;
    });
  };

  const handleWeekKeyDown = (event: React.KeyboardEvent, weekStart: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleWeek(weekStart);
    }
  };

  // Group time entries by week using the shared hook
  const weeklyData = useGroupEntriesByWeek(timeEntries);

  return (
    <div className={styles.dataSection}>
      <h3>{t("lottery.fetchEntries")}</h3>
      {displayError && <div className={styles.error}>{displayError}</div>}
      {timeEntries.length > 0 && (
        <div className={styles.results}>
          <div className={styles.weeksList}>
            {weeklyData.map((week) => {
              const isOpen = openWeeks.has(week.weekStart);
              return (
                <div key={week.weekStart} className={styles.week}>
                  <div
                    className={styles.weekHeader}
                    onClick={() => toggleWeek(week.weekStart)}
                    onKeyDown={(e) => handleWeekKeyDown(e, week.weekStart)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    aria-controls={`week-${week.weekStart}`}
                  >
                    <div className={styles.weekHeaderContent}>
                      <div className={styles.weekTitleContainer}>
                        <div className={styles.weekTitleWrapper}>
                          <h5 className={styles.weekTitle}>
                            {t("lottery.week")}: {week.weekStart} - {week.weekEnd}
                          </h5>
                          {week.isLotteryEligible && (
                            <span
                              className={styles.lotteryTicket}
                              title="This week qualifies for 1 lottery ticket! 🎫"
                              aria-label="Lottery ticket earned"
                            >
                              🎫
                            </span>
                          )}
                        </div>
                        {!week.isLotteryEligible && week.lotteryReasonKey && (
                          <p className={styles.lotteryReason} aria-live="polite">
                            {week.lotteryReasonKey === "missingHours" && week.lotteryReasonData?.missingDays
                              ? t("lottery.eligibility.missingHours", {
                                  dates: week.lotteryReasonData.missingDays.join(", "),
                                })
                              : week.lotteryReasonKey === "entriesUpdatedAfterDeadline" &&
                                week.lotteryReasonData?.latestUpdate &&
                                t("lottery.eligibility.entriesUpdatedAfterDeadline", {
                                  timestamp: formatDateReadable(week.lotteryReasonData.latestUpdate, true),
                                })}
                          </p>
                        )}
                      </div>
                      <span className={styles.weekHours}>
                        <strong>{week.hours.toFixed(2)}h</strong>
                      </span>
                    </div>
                    <span
                      className={`${styles.weekChevron} ${isOpen ? styles.weekChevronOpen : ""}`}
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </div>
                  <div
                    id={`week-${week.weekStart}`}
                    className={`${styles.weekContent} ${isOpen ? styles.weekContentOpen : ""}`}
                  >
                    <div className={styles.weekContentInner}>
                      <div className={styles.entriesList}>
                        {week.entries.map((entry) => (
                          <div key={entry.id} className={styles.entry}>
                            <div className={styles.entryHeader}>
                              <span className={styles.entryDate}>{entry.spent_date}</span>
                              <span className={styles.entryHours}>{entry.hours}h</span>
                            </div>
                            <div className={styles.entryDetails}>
                              {entry.project && <span className={styles.entryProject}>{entry.project.name}</span>}
                              {entry.task && <span className={styles.entryTask}>{entry.task.name}</span>}
                              {entry.client && <span className={styles.entryClient}>{entry.client.name}</span>}
                            </div>
                            {entry.notes && <p className={styles.entryNotes}>{entry.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

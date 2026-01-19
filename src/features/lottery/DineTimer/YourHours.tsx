import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useEmployeeWeeks, useLotteryUser, useLotteryTickets } from "../queries";
import { formatDateDDMM, formatHours } from "@/shared/utils/dateUtils";
import styles from "./YourHours.module.scss";

interface YourHoursProps {
  isAuthenticated: boolean;
  error?: string;
}

export const YourHours = ({ isAuthenticated, error }: YourHoursProps) => {
  const { t, i18n } = useTranslation();
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const hourUnit = i18n.language === "nb" ? "t" : "h";

  const { data: user } = useLotteryUser(isAuthenticated);
  const userId = user?.id.toString() || null;
  const { data: weeksData, error: weeksError } = useEmployeeWeeks(userId, isAuthenticated && !!userId);
  const { data: syncedTickets = [] } = useLotteryTickets(userId, isAuthenticated && !!userId);
  const syncedTicketsCount = syncedTickets.length;

  const displayError = error || weeksError?.message;

  const toggleWeek = (weekKey: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  const handleWeekKeyDown = (event: React.KeyboardEvent, weekKey: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleWeek(weekKey);
    }
  };

  // Use employee weeks data from backend
  const weeklyData = weeksData?.weeks || [];

  return (
    <div className={styles.dataSection}>
      {displayError && <div className={styles.error}>{displayError}</div>}

      {/* Dine lodd section */}
      {syncedTicketsCount > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t("lottery.title")}</h3>
          <div className={styles.totalTicketsBadge}>
            <span className={styles.totalTicketsText}>
              {t("lottery.totalTickets", { count: syncedTicketsCount })}
            </span>
            <span className={styles.ticketIconLarge}>🎫</span>
          </div>
        </div>
      )}

      {/* Dine uker section */}
      {weeklyData.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t("lottery.fetchEntries")}</h3>
          <div className={styles.results}>
            <div className={styles.weeksList}>
              {weeklyData
                .filter((week) => week.weekKey != null)
                .map((week) => {
                  const weekKey = week.weekKey!;
                  const isOpen = openWeeks.has(weekKey);
                  const weekNumber = parseInt(weekKey.split("-W")[1], 10);
                  return (
                    <div key={weekKey} className={styles.week}>
                      <div
                        className={styles.weekHeader}
                        onClick={() => toggleWeek(weekKey)}
                        onKeyDown={(e) => handleWeekKeyDown(e, weekKey)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        aria-controls={`week-${weekKey}`}
                      >
                        <div className={styles.weekHeaderContent}>
                          <div className={styles.weekTitleContainer}>
                            <div className={styles.weekTitleWrapper}>
                              <h5 className={styles.weekTitle}>
                                {t("lottery.week")} {weekNumber}: {formatDateDDMM(week.weekStart || "")} -{" "}
                                {formatDateDDMM(week.weekEnd || "")}
                              </h5>
                              {week.hasTicket && (
                                <span
                                  className={styles.lotteryTicket}
                                  title={t("lottery.weekDetails.hasTicket")}
                                  aria-label={t("lottery.weekDetails.hasTicket")}
                                >
                                  🎫
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={styles.weekHours}>
                            <strong>
                              {formatHours(week.hours ?? 0)}
                              {hourUnit}
                            </strong>
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
                        id={`week-${weekKey}`}
                        className={`${styles.weekContent} ${isOpen ? styles.weekContentOpen : ""}`}
                      >
                        <div className={styles.weekContentInner}>
                          <div className={styles.weekSummary}>
                            <div className={styles.summaryRow}>
                              <span className={styles.summaryLabel}>{t("lottery.weekDetails.totalHours")}</span>
                              <span className={styles.summaryValue}>
                                {formatHours(week.hours ?? 0)}
                                {hourUnit}
                              </span>
                            </div>
                            <div className={styles.summaryRow}>
                              <span className={styles.summaryLabel}>{t("lottery.weekDetails.billableHours")}</span>
                              <span className={styles.summaryValue}>
                                {formatHours(week.billableHours ?? 0)}
                                {hourUnit}
                              </span>
                            </div>
                            <div className={styles.summaryRow}>
                              <span className={styles.summaryLabel}>{t("lottery.weekDetails.lotteryStatus")}</span>
                              <span className={styles.summaryValue}>
                                {week.isLotteryEligible
                                  ? t("lottery.weekDetails.eligible")
                                  : t("lottery.weekDetails.notEligible")}
                              </span>
                            </div>
                            {week.hasTicket && (
                              <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>{t("lottery.weekDetails.hasTicket")}</span>
                                <span className={styles.summaryValue}>✓</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useEmployeeWeeks, useLotteryUser, useLotteryTickets, useSyncFromHarvest } from "../queries";
import {
  selectLotteryToken,
  setActiveSubTab,
  LotterySubTab,
  setAutoOpenWeekKey,
} from "../lotterySlice";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { formatDateDDMM, formatHours } from "@/shared/utils/dateUtils";
import { createWeekKey } from "@/features/timebank/calculations/weekUtils";
import styles from "./YourTickets.module.scss";

interface YourTicketsProps {
  isAuthenticated: boolean;
  error?: string;
  isLoading?: boolean;
  onLogin: () => void;
}

export const YourTickets = ({ isAuthenticated, error, isLoading, onLogin }: YourTicketsProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const hourUnit = i18n.language === "nb" ? "t" : "h";

  const { data: user } = useLotteryUser(isAuthenticated);
  const userId = user?.id.toString() || null;
  const token = useAppSelector(selectLotteryToken);
  const { data: weeksData, error: weeksError, refetch: refetchWeeks } = useEmployeeWeeks(
    userId,
    isAuthenticated && !!userId
  );
  const { data: syncedTickets = [], refetch: refetchTickets } = useLotteryTickets(
    userId,
    isAuthenticated && !!userId
  );
  const syncedTicketsCount = syncedTickets.length;
  const syncMutation = useSyncFromHarvest();

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

  const handleSync = async () => {
    if (!token) {
      return;
    }

    try {
      await syncMutation.mutateAsync({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
        accountId: token.accountId,
      });
      // Refetch weeks and tickets after sync
      await refetchWeeks();
      await refetchTickets();
    } catch (error) {
      // Error handling is done by the mutation
    }
  };

  // Use employee weeks data from backend
  const weeklyData = weeksData?.weeks || [];

  // Calculate current week key and check if user has ticket for current week
  const currentWeekKey = createWeekKey(new Date());
  const currentWeek = weeklyData.find((week) => week.weekKey === currentWeekKey);
  const hasCurrentWeekTicket = currentWeek?.hasTicket === true;

  const handleEligibilityClick = () => {
    dispatch(setActiveSubTab(LotterySubTab.Lottery));
    dispatch(setAutoOpenWeekKey(currentWeekKey));
  };

  return (
    <div className={styles.dataSection}>
      {displayError && <div className={styles.error}>{displayError}</div>}

      {/* Dine lodd section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("lottery.navigation.timeEntries")}</h3>
        {!isAuthenticated ? (
          <div className={styles.connectSection}>
            <p className={styles.connectDescription}>{t("lottery.description")}</p>
            <button onClick={onLogin} className={styles.connectButton} disabled={isLoading} type="button">
              {isLoading ? t("lottery.connecting") : t("lottery.connect")}
            </button>
          </div>
        ) : (
          <div className={styles.totalTicketsBadge}>
            {token && (
              <>
                {hasCurrentWeekTicket ? (
                  <button
                    className={`${styles.statusBadge} ${styles.statusEligible}`}
                    onClick={handleEligibilityClick}
                    type="button"
                  >
                    <span className={styles.statusIcon}>✓</span>
                    <span>{t("lottery.eligibleForThisWeek")}</span>
                  </button>
                ) : (
                  <button
                    className={styles.syncButton}
                    onClick={handleSync}
                    disabled={syncMutation.isPending}
                    type="button"
                  >
                    {syncMutation.isPending ? t("lottery.syncing") : t("lottery.syncTickets")}
                  </button>
                )}
              </>
            )}
            {syncedTicketsCount > 0 && (
              <div className={styles.totalTicketsContent}>
                <span className={styles.totalTicketsText}>
                  {t("lottery.totalTickets", { count: syncedTicketsCount })}
                </span>
                <span className={styles.ticketIconLarge}>🎫</span>
              </div>
            )}
            {syncMutation.isSuccess && (
              <p className={styles.syncSuccess}>{t("lottery.syncSuccess")}</p>
            )}
            {syncMutation.isError && (
              <p className={styles.syncError}>
                {syncMutation.error instanceof Error
                  ? syncMutation.error.message
                  : t("lottery.syncError")}
              </p>
            )}
          </div>
        )}
      </div>

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
                              {week.hasTicket ? (
                                <span
                                  className={styles.lotteryTicket}
                                  title={t("lottery.weekDetails.hasTicket")}
                                  aria-label={t("lottery.weekDetails.hasTicket")}
                                >
                                  🎫
                                </span>
                              ) : (
                                <span
                                  className={styles.noTicket}
                                  title={t("lottery.weekDetails.noTicket")}
                                  aria-label={t("lottery.weekDetails.noTicket")}
                                >
                                  ✗
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
                              <span className={styles.summaryLabel}>{t("lottery.weekDetails.lotteryStatus")}</span>
                              <div className={styles.weekDetailsStatus}>
                                {week.isLotteryEligible ? (
                                  <div className={`${styles.statusBadge} ${styles.statusEligible}`}>
                                    <span className={styles.statusIcon}>✓</span>
                                    <span>{t("lottery.weekDetails.eligible")}</span>
                                  </div>
                                ) : (
                                  <div className={`${styles.statusBadge} ${styles.statusNotEligible}`}>
                                    <span className={styles.statusIcon}>✗</span>
                                    <span>{t("lottery.weekDetails.notEligible")}</span>
                                  </div>
                                )}
                                {week.hasTicket && (
                                  <div className={`${styles.statusBadge} ${styles.statusTicket}`}>
                                    <span className={styles.statusIcon}>🎫</span>
                                    <span>{t("lottery.weekDetails.hasTicket")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {!week.isLotteryEligible && (
                              <div className={styles.eligibilityError}>
                                <p className={styles.eligibilityErrorText}>{t("lottery.weekDetails.notEligibleReason")}</p>
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

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useEmployeeWeeks, useLotteryUser, useSyncFromHarvest } from "../queries";
import { selectLotteryToken } from "../lotterySlice";
import { useAppSelector } from "@/app/hooks";
import { WeekDetails } from "./WeekDetails";
import { formatDateDDMM, formatHours } from "@/shared/utils/dateUtils";
import styles from "./Lotteri.module.scss";

export const Lotteri = () => {
  const { t } = useTranslation();
  const { data: user } = useLotteryUser(true);
  const userId = user?.id.toString() || null;
  const token = useAppSelector(selectLotteryToken);

  // Fetch employee weeks
  const { data: weeksData, isLoading, error, refetch } = useEmployeeWeeks(userId, !!userId);
  const syncMutation = useSyncFromHarvest();

  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());

  const handleWeekClick = (weekKey: string) => {
    setOpenWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekKey)) {
        newSet.delete(weekKey);
      } else {
        newSet.add(weekKey);
      }
      return newSet;
    });
  };

  const handleWeekKeyDown = (e: React.KeyboardEvent, weekKey: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleWeekClick(weekKey);
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
      // Refetch weeks after sync
      await refetch();
    } catch (error) {
      console.error("Failed to sync from Harvest:", error);
    }
  };

  const weeks = weeksData?.weeks || [];

  return (
    <div className={styles.dataSection}>
      <h3>{t("lottery.title")}</h3>
      <div className={styles.lotteryContent}>
        {!userId ? (
          <p className={styles.winnersText}>{t("lottery.notAuthenticated")}</p>
        ) : isLoading ? (
          <p className={styles.winnersText}>{t("lottery.loading")}</p>
        ) : error ? (
          <div>
            <p className={styles.error} role="alert">
              {error instanceof Error ? error.message : t("lottery.error")}
            </p>
            {token && (
              <button className={styles.syncButton} onClick={handleSync} type="button">
                {t("lottery.syncTickets")}
              </button>
            )}
          </div>
        ) : weeks.length === 0 ? (
          <div>
            <p className={styles.winnersText}>{t("lottery.noWeeks")}</p>
            {token && (
              <button
                className={styles.syncButton}
                onClick={handleSync}
                disabled={syncMutation.isPending}
                type="button"
              >
                {syncMutation.isPending ? t("lottery.syncing") : t("lottery.syncTickets")}
              </button>
            )}
          </div>
        ) : (
          <>
            {token && (
              <div className={styles.syncSection}>
                <button
                  className={styles.syncButton}
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  type="button"
                >
                  {syncMutation.isPending ? t("lottery.syncing") : t("lottery.syncTickets")}
                </button>
                {syncMutation.isSuccess && (
                  <p className={styles.success}>{t("lottery.syncSuccess")}</p>
                )}
                {syncMutation.isError && (
                  <p className={styles.error}>
                    {syncMutation.error instanceof Error
                      ? syncMutation.error.message
                      : t("lottery.syncError")}
                  </p>
                )}
              </div>
            )}

            <div className={styles.weeksList}>
              {weeks
                ?.filter((week) => week.weekKey != null)
                .map((week) => {
                  const weekKey = week.weekKey!;
                  const isOpen = openWeeks.has(weekKey);
                  const weekNumber = parseInt(weekKey.split("-W")[1], 10);

                  return (
                    <div key={weekKey} className={styles.week}>
                      <div
                        className={styles.weekHeader}
                        onClick={() => handleWeekClick(weekKey)}
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
                            {week.hasWon && (
                              <span
                                className={styles.winnerBadge}
                                title={t("lottery.weekDetails.youWon")}
                                aria-label={t("lottery.weekDetails.youWon")}
                              >
                                🏆
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={styles.weekHours}>
                          <strong>{formatHours(week.hours ?? 0)}t</strong>
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
                            <WeekDetails week={week} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

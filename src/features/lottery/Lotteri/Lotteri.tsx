import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useEmployeeWeeks, useLotteryUser } from "../queries";
import { selectAutoOpenWeekKey, setAutoOpenWeekKey } from "../lotterySlice";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { WeekDetails } from "./WeekDetails";
import { CountdownChip } from "./CountdownChip";
import { formatDateDDMM } from "@/shared/utils/dateUtils";
import { createWeekKey } from "@/features/timebank/calculations/weekUtils";
import { triggerConfetti } from "@/features/game/utils";
import styles from "./Lotteri.module.scss";

export const Lotteri = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: user } = useLotteryUser(true);
  const userId = user?.id.toString() || null;

  // Fetch employee weeks
  const { data: weeksData, isLoading, error } = useEmployeeWeeks(userId, !!userId);

  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const [confettiTriggered, setConfettiTriggered] = useState<Set<string>>(new Set());
  const [simulateLoser, setSimulateLoser] = useState(false);
  const autoOpenWeekKey = useAppSelector(selectAutoOpenWeekKey);
  const currentWeekKey = createWeekKey(new Date());

  const handleWeekClick = (weekKey: string, week: { winnerDrawn?: boolean; hasWon?: boolean }) => {
    setOpenWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekKey)) {
        newSet.delete(weekKey);
      } else {
        newSet.add(weekKey);
        // Trigger confetti when opening a week where user won and winner is drawn
        if (week.winnerDrawn && week.hasWon && !confettiTriggered.has(weekKey)) {
          triggerConfetti();
          setConfettiTriggered((prev) => new Set(prev).add(weekKey));
        }
      }
      return newSet;
    });
  };

  const handleCheckWinnerClick = (weekKey: string, week: { winnerDrawn?: boolean; hasWon?: boolean }) => {
    // Open the accordion
    setOpenWeeks((prev) => {
      const newSet = new Set(prev);
      newSet.add(weekKey);
      return newSet;
    });
    // Trigger confetti if user won
    if (week.hasWon && !confettiTriggered.has(weekKey)) {
      triggerConfetti();
      setConfettiTriggered((prev) => new Set(prev).add(weekKey));
    }
    // Scroll to the week element
    setTimeout(() => {
      const weekElement = document.getElementById(`week-${weekKey}`);
      if (weekElement) {
        weekElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  };

  const handleWeekKeyDown = (e: React.KeyboardEvent, weekKey: string, week: { winnerDrawn?: boolean; hasWon?: boolean }) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleWeekClick(weekKey, week);
    }
  };

  const weeks = weeksData?.weeks || [];

  // Auto-open week if specified in Redux state
  useEffect(() => {
    if (autoOpenWeekKey && weeks.length > 0) {
      const weekExists = weeks.some((week) => week.weekKey === autoOpenWeekKey);
      if (weekExists) {
        setOpenWeeks((prev) => {
          const newSet = new Set(prev);
          newSet.add(autoOpenWeekKey);
          return newSet;
        });
        // Clear the auto-open state after using it
        dispatch(setAutoOpenWeekKey(null));
        // Optionally scroll to the week element
        setTimeout(() => {
          const weekElement = document.getElementById(`week-${autoOpenWeekKey}`);
          if (weekElement) {
            weekElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 100);
      } else {
        // Clear if week doesn't exist
        dispatch(setAutoOpenWeekKey(null));
      }
    }
  }, [autoOpenWeekKey, weeks, dispatch]);

  // Modify weeks data to simulate loser if toggle is enabled
  const modifiedWeeks = simulateLoser
    ? weeks.map((week) => ({
        ...week,
        hasWon: false,
      }))
    : weeks;

  return (
    <div className={styles.dataSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>{t("lottery.title")}</h3>
        {import.meta.env.DEV && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={simulateLoser}
              onChange={(e) => setSimulateLoser(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>Simuler taper (dev)</span>
          </label>
        )}
      </div>
        {!userId ? (
          <p className={styles.winnersText}>{t("lottery.notAuthenticated")}</p>
        ) : isLoading ? (
          <p className={styles.winnersText}>{t("lottery.loading")}</p>
        ) : error ? (
          <div>
            <p className={styles.error} role="alert">
              {error instanceof Error ? error.message : t("lottery.error")}
            </p>
          </div>
        ) : weeks.length === 0 ? (
          <div>
            <p className={styles.winnersText}>{t("lottery.noWeeks")}</p>
          </div>
        ) : (
          <div className={styles.weeksList}>
            {modifiedWeeks
              ?.filter((week) => week.weekKey != null)
              .map((week) => {
                const weekKey = week.weekKey!;
                const isOpen = openWeeks.has(weekKey);
                const weekNumber = parseInt(weekKey.split("-W")[1], 10);
                const isCurrentWeek = weekKey === currentWeekKey;
                const isWinnerDrawn = week.winnerDrawn === true;
                const shouldBlur = isCurrentWeek && isWinnerDrawn && !isOpen;
                const isPreviousWeek = !isCurrentWeek;

                return (
                  <div
                    key={weekKey}
                    className={`${styles.week} ${shouldBlur ? styles.weekBlurred : ""} ${isPreviousWeek ? styles.weekPrevious : ""}`}
                  >
                    {shouldBlur && (
                      <button
                        className={styles.checkWinnerButton}
                        onClick={() => handleCheckWinnerClick(weekKey, week)}
                        type="button"
                      >
                        {t("lottery.weekDetails.checkWeeklyWinner")}
                      </button>
                    )}
                    <div
                      className={styles.weekHeader}
                      onClick={() => handleWeekClick(weekKey, week)}
                      onKeyDown={(e) => handleWeekKeyDown(e, weekKey, week)}
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
                      </div>
                      {isCurrentWeek && !isOpen && !isWinnerDrawn && (
                        <CountdownChip countdownTarget={week.countdownTarget} isActive={!week.winnerDrawn} />
                      )}
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
        )}
    </div>
  );
};

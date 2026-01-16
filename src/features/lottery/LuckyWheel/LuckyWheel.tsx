import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useWheelData, useLatestMonthlyWinners, useLotteryConfig } from "../queries";
import {
  selectSpinPhase,
  selectCurrentSpinIndex,
  selectRevealedWinners,
  setSpinPhase,
  advanceSpinIndex,
  addRevealedWinner,
  resetWheel,
  setRevealedWinners,
} from "../lotterySlice";
import type { WheelSegment, MonthlyWinner } from "../api";
import { SpinningWheel, type SpinningWheelHandle } from "./SpinningWheel";
import { WinnerRevealCard } from "./WinnerRevealCard/WinnerRevealCard";
import { ParticipantsList } from "./ParticipantsList/ParticipantsList";
import { SpinControls } from "./SpinControls/SpinControls";
import { WinnersBoard } from "./WinnersBoard/WinnersBoard";

/**
 * Interleave segments so that consecutive segments from the same user are spread out.
 * This creates a more visually appealing wheel where colors are distributed evenly.
 */
const interleaveSegments = (segments: WheelSegment[]): WheelSegment[] => {
  if (segments.length === 0) return [];

  // Group segments by userId
  const userGroups = new Map<string, WheelSegment[]>();
  segments.forEach((segment) => {
    const group = userGroups.get(segment.userId) || [];
    group.push(segment);
    userGroups.set(segment.userId, group);
  });

  // Sort users by ticket count (descending) for better distribution
  const sortedUsers = [...userGroups.entries()].sort((a, b) => b[1].length - a[1].length);

  // Interleave: take one segment from each user in round-robin fashion
  const result: WheelSegment[] = [];
  let hasMore = true;

  while (hasMore) {
    hasMore = false;
    for (const [, userSegments] of sortedUsers) {
      if (userSegments.length > 0) {
        result.push(userSegments.shift()!);
        hasMore = hasMore || userSegments.length > 0;
      }
    }
  }

  return result;
};

import { triggerGrandFinaleConfetti } from "@/shared/animations/confettiVariants";
import styles from "./LuckyWheel.module.scss";

interface LuckyWheelProps {
  isAuthenticated?: boolean;
}

export const LuckyWheel = ({ isAuthenticated: _isAuthenticated = false }: LuckyWheelProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const wheelRef = useRef<SpinningWheelHandle>(null);

  // Redux state
  const spinPhase = useAppSelector(selectSpinPhase);
  const currentSpinIndex = useAppSelector(selectCurrentSpinIndex);
  const revealedWinners = useAppSelector(selectRevealedWinners);

  // Query data
  const { data: wheelData, isLoading: isLoadingWheel, refetch: refetchWheel } = useWheelData();
  const { data: monthlyWinnersData, isLoading: isLoadingWinners, refetch: refetchWinners } = useLatestMonthlyWinners();
  const { data: config, isLoading: isLoadingConfig } = useLotteryConfig();

  // Admin panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Local state for winner reveal card
  const [showingWinner, setShowingWinner] = useState<MonthlyWinner | null>(null);

  // Countdown state
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Derived values - memoize interleaved segments to prevent recalculation
  const segments = useMemo(() => interleaveSegments(wheelData?.segments || []), [wheelData?.segments]);
  const participants = wheelData?.participants || [];
  const totalTickets = wheelData?.totalTickets || 0;
  const monthlyWinners = monthlyWinnersData?.winners || [];
  const month = monthlyWinnersData?.month || "";
  const winnerCount = config?.monthlyWinnerCount || 3;
  // Memoize nextDrawDate to prevent infinite loops in useEffect
  const nextDrawDate = useMemo(() => {
    return config?.nextMonthlyDrawDate ? new Date(config.nextMonthlyDrawDate) : null;
  }, [config?.nextMonthlyDrawDate]);

  // Filter out revealed winners' segments from the wheel display
  const displaySegments = useMemo(() => {
    if (revealedWinners.length === 0) return segments;

    const revealedUserIds = new Set(revealedWinners.map((w) => w.userId));
    return segments.filter((s) => !revealedUserIds.has(s.userId));
  }, [segments, revealedWinners]);

  // Calculate if draw is complete (all winners revealed)
  const isDrawComplete = monthlyWinners.length >= winnerCount;
  // Check if the draw has happened (winners exist to reveal)
  const isDrawReady = monthlyWinners.length > 0;
  // Show locked state when no winners have been drawn yet
  const isLocked = !isDrawReady && timeRemaining !== null;
  const canSpin =
    !isDrawComplete && spinPhase === "idle" && currentSpinIndex < monthlyWinners.length && displaySegments.length > 0;

  // Initialize revealed winners from fetched data on mount
  useEffect(() => {
    if (monthlyWinners.length > 0 && revealedWinners.length === 0) {
      // Pre-populate revealed winners if draw is already done
      dispatch(setRevealedWinners(monthlyWinners));
      if (monthlyWinners.length >= winnerCount) {
        dispatch(setSpinPhase("complete"));
      }
    }
  }, [monthlyWinners, revealedWinners.length, winnerCount, dispatch]);

  // Update countdown
  useEffect(() => {
    if (!nextDrawDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextDrawDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextDrawDate]);

  // Find segment index for a winner in the displayed segments
  const findWinnerSegmentIndex = useCallback(
    (winner: MonthlyWinner): number => {
      // Find a segment belonging to this winner in displaySegments
      const segmentIndex = displaySegments.findIndex((s) => s.userId === winner.userId);
      return segmentIndex >= 0 ? segmentIndex : 0;
    },
    [displaySegments]
  );

  // Handle spin
  const handleSpin = useCallback(() => {
    if (!canSpin || !wheelRef.current) return;

    const targetWinner = monthlyWinners[currentSpinIndex];
    if (!targetWinner) return;

    dispatch(setSpinPhase("spinning"));

    const targetSegmentIndex = findWinnerSegmentIndex(targetWinner);
    wheelRef.current.spinToSegment(targetSegmentIndex);
  }, [canSpin, monthlyWinners, currentSpinIndex, dispatch, findWinnerSegmentIndex]);

  // Handle spin complete
  const handleSpinComplete = useCallback(
    (_segmentIndex: number, _segment: WheelSegment) => {
      const targetWinner = monthlyWinners[currentSpinIndex];
      if (!targetWinner) return;

      dispatch(setSpinPhase("revealing"));
      setShowingWinner(targetWinner);
    },
    [monthlyWinners, currentSpinIndex, dispatch]
  );

  // Handle winner reveal close
  const handleWinnerRevealClose = useCallback(async () => {
    if (showingWinner) {
      // Consume the winner's tickets in the backend
      try {
        await fetch(`/api/lotterytickets/consume-winner/${showingWinner.month}/${showingWinner.position}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        // Refetch wheel data to update segments
        await refetchWheel();
      } catch (err) {
        console.error("Failed to consume winner tickets:", err);
      }

      dispatch(addRevealedWinner(showingWinner));
    }

    setShowingWinner(null);
    dispatch(advanceSpinIndex());

    // Check if all winners have been revealed
    if (currentSpinIndex + 1 >= winnerCount) {
      dispatch(setSpinPhase("complete"));
      // Trigger grand finale confetti
      triggerGrandFinaleConfetti();
    } else {
      dispatch(setSpinPhase("idle"));
    }
  }, [showingWinner, currentSpinIndex, winnerCount, dispatch, refetchWheel]);

  // Handle reset
  const handleReset = useCallback(() => {
    dispatch(resetWheel());
    wheelRef.current?.reset();
  }, [dispatch]);

  // Admin: Trigger new monthly draw
  const handleAdminTriggerDraw = useCallback(async () => {
    setIsAdminLoading(true);
    setAdminStatus(null);
    try {
      const response = await fetch("/api/lotterytickets/monthly-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setAdminStatus(`✅ Draw complete! ${data.winnersCount} winners selected for ${data.month}`);
        // Reset wheel state and refetch data
        dispatch(resetWheel());
        wheelRef.current?.reset();
        await refetchWheel();
        await refetchWinners();
      } else {
        setAdminStatus(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setAdminStatus(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsAdminLoading(false);
    }
  }, [dispatch, refetchWheel, refetchWinners]);

  // Admin: Seed test data
  const handleAdminSeedData = useCallback(async () => {
    setIsAdminLoading(true);
    setAdminStatus(null);
    try {
      const response = await fetch("/api/lotterytickets/seed-test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setAdminStatus(`✅ Seeded ${data.ticketsCreated} tickets (${data.ticketsSkipped} skipped)`);
        await refetchWheel();
      } else {
        setAdminStatus(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setAdminStatus(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsAdminLoading(false);
    }
  }, [refetchWheel]);

  // Admin: Force spin to current winner (for testing)
  const handleAdminForceSpin = useCallback(() => {
    if (!wheelRef.current || displaySegments.length === 0) return;

    const targetWinner = monthlyWinners[currentSpinIndex];
    if (!targetWinner) return;

    dispatch(setSpinPhase("spinning"));
    const targetSegmentIndex = findWinnerSegmentIndex(targetWinner);
    wheelRef.current.spinToSegment(targetSegmentIndex);
  }, [displaySegments.length, monthlyWinners, currentSpinIndex, dispatch, findWinnerSegmentIndex]);

  // Admin: Full reset (clear winners and reset wheel)
  const handleAdminFullReset = useCallback(() => {
    dispatch(resetWheel());
    wheelRef.current?.reset();
    setAdminStatus("✅ Wheel state reset");
  }, [dispatch]);

  // Admin: Advance to next spin
  const handleAdminNextSpin = useCallback(() => {
    if (currentSpinIndex < monthlyWinners.length) {
      const currentWinner = monthlyWinners[currentSpinIndex];
      if (currentWinner) {
        dispatch(addRevealedWinner(currentWinner));
      }
      dispatch(advanceSpinIndex());
      setAdminStatus(`✅ Advanced to spin ${currentSpinIndex + 2}/${winnerCount}`);
    }
  }, [currentSpinIndex, monthlyWinners, winnerCount, dispatch]);

  // Admin: Complete reset as new month (clear DB winners + reset tickets + reset wheel)
  const handleAdminNewMonth = useCallback(async () => {
    setIsAdminLoading(true);
    setAdminStatus(null);
    try {
      const response = await fetch("/api/lotterytickets/reset-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        // Reset local wheel state
        dispatch(resetWheel());
        wheelRef.current?.reset();
        // Refetch data
        await refetchWheel();
        await refetchWinners();
        setAdminStatus(
          `✅ Reset complete! ${data.ticketsReset} tickets restored, ${data.winnersDeleted} winners cleared`
        );
      } else {
        setAdminStatus(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setAdminStatus(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsAdminLoading(false);
    }
  }, [dispatch, refetchWheel, refetchWinners]);

  // Loading state
  const isLoading = isLoadingWheel || isLoadingWinners || isLoadingConfig;

  // Format date for display
  const formatDrawDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language === "nb" ? "nb-NO" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("lottery.luckyWheel.title", "Grand Finale")}</h2>
        <p className={styles.subtitle}>{t("lottery.luckyWheel.subtitle", "Monthly Lucky Wheel Draw")}</p>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>{t("lottery.loading", "Loading...")}</p>
        </div>
      ) : (
        <div className={styles.contentWrapper}>
          {/* Locked overlay with countdown */}
          {isLocked && nextDrawDate && timeRemaining && (
            <div className={styles.lockedOverlay}>
              <div className={styles.lockedContent}>
                <div className={styles.lockedIcon}>🎡</div>
                <h3 className={styles.lockedTitle}>{t("lottery.luckyWheel.nextDraw", "Next Draw")}</h3>
                <p className={styles.lockedDate}>{formatDrawDate(nextDrawDate)}</p>
                <div className={styles.lockedCountdown}>
                  <div className={styles.lockedTimeUnit}>
                    <span className={styles.lockedValue}>{timeRemaining.days}</span>
                    <span className={styles.lockedLabel}>{t("lottery.luckyWheel.days", "days")}</span>
                  </div>
                  <div className={styles.lockedTimeUnit}>
                    <span className={styles.lockedValue}>{String(timeRemaining.hours).padStart(2, "0")}</span>
                    <span className={styles.lockedLabel}>{t("lottery.luckyWheel.hours", "hrs")}</span>
                  </div>
                  <div className={styles.lockedTimeUnit}>
                    <span className={styles.lockedValue}>{String(timeRemaining.minutes).padStart(2, "0")}</span>
                    <span className={styles.lockedLabel}>{t("lottery.luckyWheel.minutes", "min")}</span>
                  </div>
                  <div className={styles.lockedTimeUnit}>
                    <span className={styles.lockedValue}>{String(timeRemaining.seconds).padStart(2, "0")}</span>
                    <span className={styles.lockedLabel}>{t("lottery.luckyWheel.seconds", "sec")}</span>
                  </div>
                </div>
                <p className={styles.lockedDescription}>
                  {t(
                    "lottery.luckyWheel.lockedDescription",
                    "The wheel will be available when the monthly draw is ready"
                  )}
                </p>
              </div>
            </div>
          )}

          <div className={`${styles.content} ${isLocked ? styles.blurred : ""}`}>
            <div className={styles.leftPanel}>
              <ParticipantsList participants={participants} totalTickets={totalTickets} />
              {nextDrawDate && timeRemaining && !isLocked && (
                <div className={styles.countdown}>
                  <h4 className={styles.countdownTitle}>{t("lottery.luckyWheel.nextDraw", "Next Draw")}</h4>
                  <p className={styles.countdownDate}>{formatDrawDate(nextDrawDate)}</p>
                  <div className={styles.countdownTimer}>
                    <div className={styles.timeUnit}>
                      <span className={styles.value}>{timeRemaining.days}</span>
                      <span className={styles.label}>{t("lottery.luckyWheel.days", "days")}</span>
                    </div>
                    <div className={styles.timeUnit}>
                      <span className={styles.value}>{timeRemaining.hours}</span>
                      <span className={styles.label}>{t("lottery.luckyWheel.hours", "hrs")}</span>
                    </div>
                    <div className={styles.timeUnit}>
                      <span className={styles.value}>{timeRemaining.minutes}</span>
                      <span className={styles.label}>{t("lottery.luckyWheel.minutes", "min")}</span>
                    </div>
                    <div className={styles.timeUnit}>
                      <span className={styles.value}>{timeRemaining.seconds}</span>
                      <span className={styles.label}>{t("lottery.luckyWheel.seconds", "sec")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.centerPanel}>
              <div className={styles.wheelWrapper}>
                <SpinningWheel
                  ref={wheelRef}
                  segments={displaySegments}
                  onSpinComplete={handleSpinComplete}
                  size={380}
                />
              </div>
              <SpinControls
                currentSpin={currentSpinIndex}
                totalSpins={winnerCount}
                spinPhase={spinPhase}
                canSpin={canSpin}
                onSpin={handleSpin}
                onReset={handleReset}
              />
            </div>

            <div className={styles.rightPanel}>
              <WinnersBoard winners={revealedWinners} month={month} />
            </div>
          </div>
        </div>
      )}

      {/* Winner reveal overlay */}
      {showingWinner && <WinnerRevealCard winner={showingWinner} onClose={handleWinnerRevealClose} />}

      {/* Admin Panel Toggle Button */}
      <button
        className={styles.adminToggle}
        onClick={() => setShowAdminPanel(!showAdminPanel)}
        title="Toggle Admin Panel"
      >
        ⚙️
      </button>

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className={styles.adminPanel}>
          <div className={styles.adminHeader}>
            <h4>🔧 Admin Controls</h4>
            <button onClick={() => setShowAdminPanel(false)}>✕</button>
          </div>
          <div className={styles.adminContent}>
            <div className={styles.adminSection}>
              <h5>Data</h5>
              <button onClick={handleAdminSeedData} disabled={isAdminLoading} className={styles.adminButton}>
                🌱 Seed Test Data
              </button>
              <button onClick={handleAdminTriggerDraw} disabled={isAdminLoading} className={styles.adminButton}>
                🎲 Trigger Monthly Draw
              </button>
            </div>
            <div className={styles.adminSection}>
              <h5>Wheel</h5>
              <button
                onClick={handleAdminForceSpin}
                disabled={
                  isAdminLoading ||
                  spinPhase === "spinning" ||
                  displaySegments.length === 0 ||
                  currentSpinIndex >= monthlyWinners.length
                }
                className={styles.adminButton}
              >
                🎰 Spin to Winner {currentSpinIndex + 1}
              </button>
              <button
                onClick={handleAdminNextSpin}
                disabled={isAdminLoading || currentSpinIndex >= monthlyWinners.length}
                className={styles.adminButton}
              >
                ⏭️ Skip to Next Spin
              </button>
              <button onClick={handleAdminFullReset} disabled={isAdminLoading} className={styles.adminButton}>
                🔄 Reset Wheel State
              </button>
              <button
                onClick={handleAdminNewMonth}
                disabled={isAdminLoading}
                className={styles.adminButton}
                style={{ backgroundColor: "#e74c3c" }}
              >
                🗑️ Reset as New Month
              </button>
            </div>
            <div className={styles.adminSection}>
              <h5>Debug Info</h5>
              <div className={styles.adminDebug}>
                <p>
                  Phase: <code>{spinPhase}</code>
                </p>
                <p>
                  Spin Index:{" "}
                  <code>
                    {currentSpinIndex}/{winnerCount}
                  </code>
                </p>
                <p>
                  Segments (total): <code>{segments.length}</code>
                </p>
                <p>
                  Segments (display): <code>{displaySegments.length}</code>
                </p>
                <p>
                  Participants: <code>{participants.length}</code>
                </p>
                <p>
                  Winners Revealed: <code>{revealedWinners.length}</code>
                </p>
                <p>
                  Draw Complete: <code>{String(isDrawComplete)}</code>
                </p>
              </div>
            </div>
            {adminStatus && <div className={styles.adminStatus}>{adminStatus}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

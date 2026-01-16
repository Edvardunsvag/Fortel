import { useTranslation } from "react-i18next";
import type { SpinPhase } from "../../lotterySlice";
import styles from "./SpinControls.module.scss";

interface SpinControlsProps {
  currentSpin: number;
  totalSpins: number;
  spinPhase: SpinPhase;
  canSpin: boolean;
  onSpin: () => void;
  onReset: () => void;
}

export const SpinControls = ({
  currentSpin,
  totalSpins,
  spinPhase,
  canSpin,
  onSpin,
  onReset,
}: SpinControlsProps) => {
  const { t } = useTranslation();

  const isComplete = spinPhase === "complete";
  const isSpinning = spinPhase === "spinning";
  const isRevealing = spinPhase === "revealing";

  const getButtonText = () => {
    if (isSpinning) {
      return t("lottery.luckyWheel.controls.spinning", "Spinning...");
    }
    if (isRevealing) {
      return t("lottery.luckyWheel.controls.revealing", "Revealing...");
    }
    if (isComplete) {
      return t("lottery.luckyWheel.controls.complete", "Complete!");
    }
    if (currentSpin === 0) {
      return t("lottery.luckyWheel.controls.startSpin", "SPIN!");
    }
    return t("lottery.luckyWheel.controls.nextSpin", "Next Spin");
  };

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span className={styles.progressText}>
          {t("lottery.luckyWheel.controls.spinProgress", {
            current: Math.min(currentSpin + 1, totalSpins),
            total: totalSpins,
            defaultValue: "Spin {{current}} of {{total}}",
          })}
        </span>
        <div className={styles.progressBar}>
          {Array.from({ length: totalSpins }).map((_, index) => (
            <div
              key={index}
              className={`${styles.progressDot} ${
                index < currentSpin ? styles.completed : ""
              } ${index === currentSpin && !isComplete ? styles.current : ""}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.buttons}>
        {isComplete ? (
          <button className={styles.resetButton} onClick={onReset}>
            {t("lottery.luckyWheel.controls.reset", "Reset")}
          </button>
        ) : (
          <button
            className={styles.spinButton}
            onClick={onSpin}
            disabled={!canSpin || isSpinning || isRevealing}
          >
            {getButtonText()}
          </button>
        )}
      </div>
    </div>
  );
};

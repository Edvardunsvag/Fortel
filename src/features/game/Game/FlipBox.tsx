import { useEffect, useState } from "react";
import { HintResult } from "@/features/game/types";
import styles from "./FlipBox.module.scss";

interface FlipBoxProps {
  label: string;
  value: string;
  result: HintResult;
  delay?: number;
  showArrow?: boolean;
  arrowDirection?: "up" | "down";
}

export const FlipBox = ({
  label,
  value,
  result,
  delay = 0,
  showArrow = false,
  arrowDirection = "up",
}: FlipBoxProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (delay >= 0) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const getResultClass = (): string => {
    switch (result) {
      case "correct":
        return styles.correct;
      case "partial":
        return styles.partial;
      case "incorrect":
      case "none":
        return styles.incorrect;
      case "higher":
        return styles.higher;
      case "lower":
        return styles.lower;
      case "equal":
        return styles.equal;
      default:
        return "";
    }
  };

  return (
    <div className={styles.flipContainer}>
      <div
        className={`${styles.flipBox} ${getResultClass()} ${isFlipped ? styles.flipped : ""}`}
        aria-label={`${label}: ${value} - ${result}`}
      >
        <div className={styles.flipInner}>
          <div className={styles.flipFront}>
            <span className={styles.label}>{label}</span>
          </div>
          <div className={styles.flipBack}>
            <span className={styles.value}>{value}</span>
            {showArrow && (
              <span
                className={`${styles.arrow} ${arrowDirection === "up" ? styles.arrowUp : styles.arrowDown}`}
                aria-hidden="true"
              >
                {arrowDirection === "up" ? "↑" : "↓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState, type ReactNode } from "react";
import { HintResult } from "@/features/game/types";
import styles from "./FlipBox.module.scss";

interface FlipBoxProps {
  label: string;
  value: string;
  result: HintResult;
  delay?: number;
  showArrow?: boolean;
  arrowDirection?: "up" | "down";
  icon?: ReactNode;
  className?: string;
}

export const FlipBox = ({
  label,
  value,
  result,
  delay = 0,
  showArrow = false,
  arrowDirection = "up",
  icon,
  className,
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
        className={`${styles.flipBox} ${getResultClass()} ${isFlipped ? styles.flipped : ""} ${className ? styles[className] || className : ""}`}
        aria-label={`${label}: ${value} - ${result}`}
      >
        <div className={styles.flipInner}>
          <div className={styles.flipFront}>
            <span className={styles.label}>{label}</span>
          </div>
          <div className={styles.flipBack}>
            <div className={styles.valueContainer}>
              <span className={styles.value}>{value}</span>
              {icon && <span className={styles.icon}>{icon}</span>}
            </div>
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

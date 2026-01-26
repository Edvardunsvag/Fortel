import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import type { Guess } from "@/features/game/types";
import { HintType } from "@/features/game/types";
import { FlipBox } from "@/features/game/Game/FlipBox";
import { calculateBoxDelay, getHintArrow, getHintResult, getHintValue } from "@/features/game/Game/GuessList/utils";
import styles from "./HintCell.module.scss";

interface HintCellProps {
  guess: Guess;
  hintType: HintType;
  guessIndex: number;
  boxIndex: number;
  isAnimated: boolean;
  t: (key: string) => string;
}

export const HintCell = ({ guess, hintType, guessIndex, boxIndex, isAnimated, t }: HintCellProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);
  const delay = calculateBoxDelay(guessIndex, boxIndex, isAnimated);
  const fullValue = getHintValue(guess, hintType);
  const result = getHintResult(guess, hintType);
  const arrow = getHintArrow(guess, hintType);

  useEffect(() => {
    if (showTooltip && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showTooltip]);

  // Handle teams specially - show only first 2, rest in tooltip
  let displayValue = fullValue;
  let hasMoreTeams = false;
  let allTeams: string[] = [];

  if (hintType === HintType.Teams && fullValue && fullValue !== "-") {
    allTeams = fullValue.split(", ").filter(Boolean);
    if (allTeams.length > 2) {
      hasMoreTeams = true;
      displayValue = allTeams.slice(0, 2).join(", ");
    }
  }

  return (
    <td className={styles.hintCell}>
      <div className={styles.hintCellWrapper}>
        <FlipBox
          label={t(`guessList.${hintType}`)}
          value={displayValue}
          result={result}
          delay={delay}
          showArrow={hintType === HintType.Age ? arrow.show : false}
          arrowDirection={arrow.direction}
          icon={hasMoreTeams ? <Info className={styles.tooltipIcon} aria-label="Show all teams" /> : undefined}
          className={hintType === HintType.Teams ? "teamsBox" : undefined}
        />
        {hasMoreTeams && (
          <>
            <div
              ref={iconRef}
              className={styles.tooltipContainer}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div
                className={styles.tooltip}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                }}
              >
                <div className={styles.tooltipContent}>
                  <div className={styles.tooltipTitle}>All Teams:</div>
                  <div className={styles.tooltipTeams}>
                    {allTeams.map((team, index) => (
                      <span key={index} className={styles.tooltipTeam}>
                        {team}
                        {index < allTeams.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </td>
  );
};

import { useTranslation } from "react-i18next";
import { useCountdown } from "../hooks/useCountdown";
import styles from "./Lotteri.module.scss";

interface CountdownChipProps {
  countdownTarget: string | null | undefined;
  isActive: boolean;
}

export const CountdownChip = ({ countdownTarget, isActive }: CountdownChipProps) => {
  const { t } = useTranslation();
  const timeRemaining = useCountdown(countdownTarget, isActive);

  // Don't render if no time remaining (same logic as WeekDetails)
  if (!timeRemaining) {
    return null;
  }

  // Build array of time unit parts
  const timeParts: string[] = [];
  if (timeRemaining.days > 0) {
    timeParts.push(`${timeRemaining.days}${t("lottery.luckyWheel.days", "d")}`);
  }
  if (timeRemaining.hours > 0 || timeParts.length > 0) {
    timeParts.push(`${timeRemaining.hours}${t("lottery.luckyWheel.hours", "t")}`);
  }
  if (timeRemaining.minutes > 0 || timeParts.length > 0) {
    timeParts.push(`${timeRemaining.minutes}${t("lottery.luckyWheel.minutes", "m")}`);
  }
  // Always show seconds to ensure the chip updates every second
  timeParts.push(`${timeRemaining.seconds}${t("lottery.luckyWheel.seconds", "s")}`);

  return (
    <span className={styles.countdownChip} title={t("lottery.weekDetails.countdownLabel")}>
      {timeParts.map((part, index) => (
        <span key={index} className={styles.countdownChipPart}>
          {part}
        </span>
      ))}
    </span>
  );
};

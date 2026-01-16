import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TimeBalance } from "../types";
import { formatBalance, getBalanceClass } from "../timebankUtils";
import { triggerPositiveBalanceConfetti } from "@/shared/animations";
import styles from "./TimeBankPage.module.scss";

interface TimeBalanceCardProps {
  balance: TimeBalance;
}

export const TimeBalanceCard = ({ balance }: TimeBalanceCardProps) => {
  const { t } = useTranslation();
  const balanceClass = getBalanceClass(balance.balance);
  const hasTriggeredRef = useRef(false);
  const [shouldShake, setShouldShake] = useState(false);

  // Calculate total possible overtime hours across all weeks
  // Sum all differences (positive and negative), then take max with 0
  const totalPossibleOvertime = Math.max(
    0,
    balance.weeklyBreakdown.reduce((sum, week) => sum + week.possibleOvertimeHours, 0)
  );

  // Trigger confetti for positive balance or shake for negative
  useEffect(() => {
    if (hasTriggeredRef.current) return;
    const hasData = balance.totalLogged > 0 || balance.totalExpected > 0;
    if (!hasData) return;

    hasTriggeredRef.current = true;

    if (balance.balance >= 0) {
      triggerPositiveBalanceConfetti();
    } else {
      setShouldShake(true);
      // Remove shake class after animation completes
      setTimeout(() => setShouldShake(false), 500);
    }
  }, [balance.balance, balance.totalLogged, balance.totalExpected]);

  const balanceColorClass =
    balanceClass === "positive"
      ? styles.balancePositive
      : balanceClass === "negative"
        ? styles.balanceNegative
        : styles.balanceNeutral;

  const cardClasses = `${styles.balanceCard}${shouldShake ? ` ${styles.balanceCardShake}` : ""}`;

  return (
    <div className={cardClasses}>
      <div className={styles.balanceLabel}>{t("timebank.balanceLabel")}</div>
      <div className={`${styles.balanceValue} ${balanceColorClass}`}>{formatBalance(balance.balance, t("timebank.hourSuffix"))}</div>
      <div className={styles.balanceDetails}>
        <div className={styles.balanceDetail}>
          <div className={styles.balanceDetailValue}>{balance.totalLogged.toFixed(1)}{t("timebank.hourSuffix")}</div>
          <div className={styles.balanceDetailLabel}>{t("timebank.logged")}</div>
        </div>
        <div className={styles.balanceDetail}>
          <div className={styles.balanceDetailValue}>{balance.totalExpected.toFixed(1)}{t("timebank.hourSuffix")}</div>
          <div className={styles.balanceDetailLabel}>{t("timebank.expected")}</div>
        </div>
      </div>
      {totalPossibleOvertime > 0 && (
        <div className={styles.possibleOvertimeTotal}>
          {t("timebank.possibleOvertime")}: {totalPossibleOvertime.toFixed(1)}{t("timebank.hourSuffix")}
        </div>
      )}
    </div>
  );
};

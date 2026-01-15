import { useTranslation } from "react-i18next";
import type { TimeBalance } from "../types";
import { formatBalance, getBalanceClass } from "../timebankUtils";
import styles from "./TimeBankPage.module.scss";

interface TimeBalanceCardProps {
  balance: TimeBalance;
}

export const TimeBalanceCard = ({ balance }: TimeBalanceCardProps) => {
  const { t } = useTranslation();
  const balanceClass = getBalanceClass(balance.balance);

  const balanceColorClass =
    balanceClass === "positive"
      ? styles.balancePositive
      : balanceClass === "negative"
        ? styles.balanceNegative
        : styles.balanceNeutral;

  return (
    <div className={styles.balanceCard}>
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
    </div>
  );
};

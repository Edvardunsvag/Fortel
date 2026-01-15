import { useTranslation } from "react-i18next";
import type { FagtimerBalance } from "../timebankUtils";
import styles from "./TimeBankPage.module.scss";

interface FagtimerCardProps {
  balance: FagtimerBalance;
}

export const FagtimerCard = ({ balance }: FagtimerCardProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.fagtimerCard}>
      <div className={styles.fagtimerHeader}>
        <span className={styles.fagtimerTitle}>{t("timebank.fagtimer.title")}</span>
        <span className={styles.fagtimerSubtitle}>{t("timebank.fagtimer.subtitle")}</span>
      </div>

      <div className={styles.fagtimerContent}>
        <div className={styles.fagtimerStats}>
          <span className={styles.fagtimerUsed}>{balance.used.toFixed(1)}{t("timebank.hourSuffix")}</span>
          <span className={styles.fagtimerSeparator}>/</span>
          <span className={styles.fagtimerAvailable}>{balance.available}{t("timebank.hourSuffix")}</span>
        </div>

        <div className={styles.fagtimerProgressContainer}>
          <div className={styles.fagtimerProgressBar}>
            <div
              className={`${styles.fagtimerProgressFill} ${balance.percentage >= 100 ? styles.complete : ""}`}
              style={{ width: `${Math.min(balance.percentage, 100)}%` }}
            />
          </div>
          <span className={styles.fagtimerPercentage}>{balance.percentage.toFixed(0)}%</span>
        </div>

        <p className={styles.fagtimerNote}>{t("timebank.fagtimer.note")}</p>
      </div>
    </div>
  );
};

import { useTranslation } from "react-i18next";
import styles from "./TimeBankRules.module.scss";

export const TimeBankRules = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.rulesContainer}>
      {/* Working Hours */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("timebank.rules.workingHours.title")}</h2>
        <div className={styles.card}>
          <ul className={styles.list}>
            <li>{t("timebank.rules.workingHours.coreTime")}</li>
            <li>{t("timebank.rules.workingHours.regularHours")}</li>
          </ul>
        </div>
      </section>

      {/* Overtime */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("timebank.rules.overtime.title")}</h2>
        <div className={styles.card}>
          <p className={styles.intro}>{t("timebank.rules.overtime.intro")}</p>

          <h3 className={styles.subsectionTitle}>{t("timebank.rules.overtime.examplesTitle")}</h3>
          <ul className={styles.list}>
            <li>{t("timebank.rules.overtime.example1")}</li>
            <li>{t("timebank.rules.overtime.example2")}</li>
          </ul>

          <p className={styles.note}>{t("timebank.rules.overtime.nonBillableNote")}</p>

          <h3 className={styles.subsectionTitle}>{t("timebank.rules.overtime.compensationTitle")}</h3>
          <p>{t("timebank.rules.overtime.compensationIntro")}</p>

          <div className={styles.ratesGrid}>
            <div className={styles.rateCard}>
              <span className={styles.rateLabel}>{t("timebank.rules.overtime.mondayToSaturday")}</span>
              <span className={styles.rateValue}>1h → 1.5h</span>
              <span className={styles.ratePercent}>50%</span>
            </div>
            <div className={styles.rateCard}>
              <span className={styles.rateLabel}>{t("timebank.rules.overtime.sunday")}</span>
              <span className={styles.rateValue}>1h → 2h</span>
              <span className={styles.ratePercent}>100%</span>
            </div>
          </div>

          <p className={styles.note}>{t("timebank.rules.overtime.timeOffNote")}</p>

          <h3 className={styles.subsectionTitle}>{t("timebank.rules.overtime.limitsTitle")}</h3>
          <ul className={styles.list}>
            <li>{t("timebank.rules.overtime.limit1")}</li>
            <li>{t("timebank.rules.overtime.limit2")}</li>
            <li>{t("timebank.rules.overtime.limit3")}</li>
          </ul>
        </div>
      </section>

      {/* Flextime */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("timebank.rules.flextime.title")}</h2>
        <div className={styles.card}>
          <p className={styles.intro}>{t("timebank.rules.flextime.intro")}</p>

          <h3 className={styles.subsectionTitle}>{t("timebank.rules.flextime.practiceTitle")}</h3>
          <ul className={styles.list}>
            <li>{t("timebank.rules.flextime.practice1")}</li>
            <li>{t("timebank.rules.flextime.practice2")}</li>
            <li>{t("timebank.rules.flextime.practice3")}</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

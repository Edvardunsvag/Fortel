import { useTranslation } from "react-i18next";
import styles from "./Regler.module.scss";

export const Regler = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.dataSection}>
      <h3>{t("lottery.rules.title")}</h3>
      <div className={styles.rulesContent}>
        <h4>{t("lottery.rules.eligibility")}</h4>
        <ul>
          <li>{t("lottery.rules.rule1")}</li>
          <li>{t("lottery.rules.rule2")}</li>
        </ul>
        <h4>{t("lottery.rules.monthChange")}</h4>
        <ul>
          <li>{t("lottery.rules.rule3")}</li>
        </ul>
        <h4>{t("lottery.rules.howItWorks")}</h4>
        <p>{t("lottery.rules.description")}</p>
      </div>
    </div>
  );
};

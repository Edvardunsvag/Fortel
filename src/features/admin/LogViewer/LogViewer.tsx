import { useTranslation } from "react-i18next";
import styles from "./LogViewer.module.scss";

export const LogViewer = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.content}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("admin.logging.title")}</h2>
        <p className={styles.subtitle}>{t("admin.logging.subtitle")}</p>

        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>📋</span>
          <p className={styles.placeholderText}>{t("admin.logging.comingSoon")}</p>
        </div>
      </div>
    </div>
  );
};

import { useTranslation } from 'react-i18next';
import styles from './ColorLegend.module.scss';

export const ColorLegend = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.legend}>
      <div className={styles.indicators}>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.correct}`} aria-hidden="true" />
          <span className={styles.label}>{t('colorLegend.correct')}</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.partial}`} aria-hidden="true" />
          <span className={styles.label}>{t('colorLegend.partial')}</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.incorrect}`} aria-hidden="true" />
          <span className={styles.label}>{t('colorLegend.incorrect')}</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.higher}`} aria-hidden="true">
            <span className={styles.arrow}>↑</span>
          </div>
          <span className={styles.label}>{t('colorLegend.higher')}</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.lower}`} aria-hidden="true">
            <span className={styles.arrow}>↓</span>
          </div>
          <span className={styles.label}>{t('colorLegend.lower')}</span>
        </div>
      </div>
    </div>
  );
};


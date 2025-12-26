import styles from './ColorLegend.module.scss';

export const ColorLegend = () => {
  return (
    <div className={styles.legend}>
      <div className={styles.indicators}>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.correct}`} aria-hidden="true" />
          <span className={styles.label}>Correct</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.partial}`} aria-hidden="true" />
          <span className={styles.label}>Partial</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.incorrect}`} aria-hidden="true" />
          <span className={styles.label}>Incorrect</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.higher}`} aria-hidden="true">
            <span className={styles.arrow}>↑</span>
          </div>
          <span className={styles.label}>Higher</span>
        </div>
        <div className={styles.indicator}>
          <div className={`${styles.square} ${styles.lower}`} aria-hidden="true">
            <span className={styles.arrow}>↓</span>
          </div>
          <span className={styles.label}>Lower</span>
        </div>
      </div>
    </div>
  );
};


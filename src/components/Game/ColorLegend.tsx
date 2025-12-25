import { useState } from 'react';
import styles from './ColorLegend.module.scss';

const ColorLegend = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleButton}
        onClick={handleToggle}
        aria-label="Show color indicators"
        aria-expanded={isOpen}
      >
        Color indicators
      </button>

      {isOpen && (
        <div className={styles.legend} role="dialog" aria-labelledby="legend-title">
          <div className={styles.legendHeader}>
            <h3 id="legend-title" className={styles.legendTitle}>
              Color indicators
            </h3>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close legend"
            >
              ×
            </button>
          </div>
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
      )}
    </div>
  );
};

export default ColorLegend;


import styles from './Pages.module.scss';

const Rules = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Rules</h1>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>How to Play</h2>
            <p className={styles.text}>
              Guess the employee of the day! You have 6 attempts to figure out who the selected employee is.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Hints</h2>
            <p className={styles.text}>
              After each guess, you'll receive hints about:
            </p>
            <ul className={styles.list}>
              <li><strong>Department:</strong> Whether the guessed employee is in the same department</li>
              <li><strong>Office:</strong> Whether they work in the same office location</li>
              <li><strong>Skills:</strong> How many skills match between the guessed and target employee</li>
              <li><strong>Seniority:</strong> Whether the guessed employee has higher, lower, or equal seniority</li>
              <li><strong>Age:</strong> Whether the guessed employee is older, younger, or the same age</li>
              <li><strong>Year Started:</strong> Whether the guessed employee started earlier, later, or the same year</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Color Legend</h2>
            <ul className={styles.list}>
              <li><span className={styles.correct}>Green</span> - Correct match</li>
              <li><span className={styles.partial}>Yellow</span> - Partial match</li>
              <li><span className={styles.incorrect}>Red</span> - No match</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Winning</h2>
            <p className={styles.text}>
              Win by correctly guessing the employee within 6 attempts. The employee of the day changes daily, so come back tomorrow for a new challenge!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Rules;


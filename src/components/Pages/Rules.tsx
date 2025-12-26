import { ColorLegend } from '../Game/ColorLegend';
import styles from './Pages.module.scss';

export const Rules = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Rules</h1>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>How to Play</h2>
            <p className={styles.text}>
              Guess the employee of the day! You have infinite attempts to figure out who the selected employee is.
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
              <li><strong>Teams:</strong> Whether the guessed employee is on the same teams as the target employee</li>
              <li><strong>Age:</strong> Whether the guessed employee is older, younger, or the same age</li>
              <li><strong>Supervisor:</strong> Whether the guessed employee has the same supervisor</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Color Legend</h2>
            <ColorLegend />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Winning</h2>
            <p className={styles.text}>
              Win by correctly guessing the employee. The employee of the day changes daily, so come back tomorrow for a new challenge!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};


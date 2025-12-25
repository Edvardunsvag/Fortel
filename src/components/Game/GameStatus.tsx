import type { GameState } from '@/features/game';
import styles from './GameStatus.module.scss';

interface GameStatusProps {
  status: GameState['status'];
  guesses: GameState['guesses'];
}

const GameStatus = ({ status, guesses }: GameStatusProps) => {
  if (status === 'won') {
    return (
      <div className={`${styles.status} ${styles.won}`} role="status">
        <h2>🎉 Congratulations!</h2>
        <p>You guessed correctly in {guesses.length} attempt{guesses.length !== 1 ? 's' : ''}!</p>
      </div>
    );
  }

  if (status === 'lost') {
    return (
      <div className={`${styles.status} ${styles.lost}`} role="status">
        <h2>Game Over</h2>
        <p>You've used all your guesses. Try again tomorrow!</p>
      </div>
    );
  }

  return (
    <div className={styles.status} role="status">
      <p className={styles.guessCount}>
        Guesses: <strong>{guesses.length}</strong>
      </p>
    </div>
  );
};

export default GameStatus;


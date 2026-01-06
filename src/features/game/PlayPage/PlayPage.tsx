import { Game } from '../Game/Game';
import styles from './PlayPage.module.scss';

export const PlayPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Game />
      </div>
    </div>
  );
};


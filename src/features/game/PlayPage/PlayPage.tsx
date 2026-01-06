import { Game } from '../Game/Game';
import styles from './PlayPage.module.scss';

export const PlayPage = () => {
  return (
    <div className={styles.page}>
      <Game />
    </div>
  );
};


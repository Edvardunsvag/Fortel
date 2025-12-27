import { Game } from '../Game/Game';
import styles from './Pages.module.scss';

export const Play = () => {
  return (
    <div className={styles.page}>
      <Game />
    </div>
  );
};


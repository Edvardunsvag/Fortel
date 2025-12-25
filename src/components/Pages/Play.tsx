import Game from '../Game/Game';
import styles from './Pages.module.scss';

const Play = () => {
  return (
    <div className={styles.pageContent}>
      <Game />
    </div>
  );
};

export default Play;


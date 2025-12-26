import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setActiveTab, selectActiveTab, ActiveTab } from '@/features/navigation';
import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);

  const handleTabClick = (tab: ActiveTab) => {
    dispatch(setActiveTab(tab));
  };

  const handleKeyDown = (event: React.KeyboardEvent, tab: ActiveTab) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tab);
    }
  };

  return (
    <nav className={styles.sidebar} aria-label="Main navigation">
      <ul className={styles.navList}>
        <li>
          <button
            className={`${styles.navItem} ${activeTab === ActiveTab.Play ? styles.active : ''}`}
            onClick={() => handleTabClick(ActiveTab.Play)}
            onKeyDown={(e) => handleKeyDown(e, ActiveTab.Play)}
            aria-label="Play"
            aria-current={activeTab === ActiveTab.Play ? 'page' : undefined}
          >
            <span className={styles.icon}>🎮</span>
            <span className={styles.label}>Play</span>
          </button>
        </li>
        <li>
          <button
            className={`${styles.navItem} ${activeTab === ActiveTab.Leaderboard ? styles.active : ''}`}
            onClick={() => handleTabClick(ActiveTab.Leaderboard)}
            onKeyDown={(e) => handleKeyDown(e, ActiveTab.Leaderboard)}
            aria-label="Leaderboard"
            aria-current={activeTab === ActiveTab.Leaderboard ? 'page' : undefined}
          >
            <span className={styles.icon}>🏆</span>
            <span className={styles.label}>Leaderboard</span>
          </button>
        </li>
        <li>
          <button
            className={`${styles.navItem} ${activeTab === ActiveTab.Rules ? styles.active : ''}`}
            onClick={() => handleTabClick(ActiveTab.Rules)}
            onKeyDown={(e) => handleKeyDown(e, ActiveTab.Rules)}
            aria-label="Rules"
            aria-current={activeTab === ActiveTab.Rules ? 'page' : undefined}
          >
            <span className={styles.icon}>📖</span>
            <span className={styles.label}>Rules</span>
          </button>
        </li>
        <li>
          <button
            className={`${styles.navItem} ${activeTab === ActiveTab.Sync ? styles.active : ''}`}
            onClick={() => handleTabClick(ActiveTab.Sync)}
            onKeyDown={(e) => handleKeyDown(e, ActiveTab.Sync)}
            aria-label="Sync"
            aria-current={activeTab === ActiveTab.Sync ? 'page' : undefined}
          >
            <span className={styles.icon}>🔄</span>
            <span className={styles.label}>Sync</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};


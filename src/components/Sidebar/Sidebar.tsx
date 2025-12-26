import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setActiveTab, selectActiveTab, ActiveTab } from '@/features/navigation';
import { SidebarItem } from './SidebarItem';
import { LanguageToggle } from '../LanguageToggle/LanguageToggle';
import { LoginButton } from '../LoginButton/LoginButton';
import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const { t } = useTranslation();
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
        <SidebarItem
          tab={ActiveTab.Play}
          icon="🎮"
          label={t('sidebar.fortedle')}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
        <SidebarItem
          tab={ActiveTab.Leaderboard}
          icon="🏆"
          label={t('sidebar.leaderboard')}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
        <SidebarItem
          tab={ActiveTab.Rules}
          icon="📖"
          label={t('sidebar.rules')}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
         <SidebarItem
          tab={ActiveTab.Employees}
          icon="👥"
          label={t('sidebar.employees')}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
        <SidebarItem
          tab={ActiveTab.Sync}
          icon="🔄"
          label={t('sidebar.sync')}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
      </ul>
      <div className={styles.authContainer}>
        <LoginButton />
      </div>
      <div className={styles.languageToggleContainer}>
        <LanguageToggle />
      </div>
    </nav>
  );
};


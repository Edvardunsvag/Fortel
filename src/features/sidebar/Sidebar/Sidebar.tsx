import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setActiveTab, selectActiveTab, ActiveTab } from '@/features/sidebar/navigationSlice';
import { selectAccount } from '@/features/auth/authSlice';
import { ADMIN_ACCOUNT } from '@/shared/config/adminConfig';
import { SidebarItem } from './SidebarItem';
import { LanguageToggle } from '../LanguageToggle/LanguageToggle';
import { LoginButton } from '../LoginButton/LoginButton';
import { AdminButton } from '../AdminButton/AdminButton';
import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);
  const account = useAppSelector(selectAccount);
  const isAdmin = account?.username === ADMIN_ACCOUNT;

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
      <div className={styles.logoContainer}>
        <img 
          src="/forte-logo.svg" 
          alt="Forte" 
          className={styles.logo}
        />
      </div>
      {account && (
        <div className={styles.userNameContainer}>
          <span className={styles.userName} title={account.name || account.username}>
            {account.name || account.username}
          </span>
        </div>
      )}
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
        {isAdmin && (
          <SidebarItem
            tab={ActiveTab.Sync}
            icon="🔄"
            label={t('sidebar.sync')}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onKeyDown={handleKeyDown}
          />
        )}
      </ul>
      <div className={styles.adminContainer}>
        <AdminButton />
      </div>
      <div className={styles.authContainer}>
        <LanguageToggle />
      </div>
      <div className={styles.languageToggleContainer}>
        <LoginButton />
      </div>
    </nav>
  );
};


import { Link, useLocation } from 'react-router-dom';
import { ActiveTab } from '@/features/sidebar';
import { tabToRoute } from '@/shared/routes';
import styles from './Sidebar.module.scss';

interface SidebarItemProps {
  tab: ActiveTab;
  icon: string;
  label: string;
  activeTab: ActiveTab;
  onTabClick: (tab: ActiveTab) => void;
  onKeyDown: (event: React.KeyboardEvent, tab: ActiveTab) => void;
}

export const SidebarItem = ({
  tab,
  icon,
  label,
  activeTab,
  onTabClick,
  onKeyDown,
}: SidebarItemProps) => {
  const location = useLocation();
  const route = tabToRoute[tab];
  const isActive = activeTab === tab || location.pathname === route;

  return (
    <li>
      <Link
        to={route}
        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => onTabClick(tab)}
        onKeyDown={(e) => onKeyDown(e, tab)}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </Link>
    </li>
  );
};


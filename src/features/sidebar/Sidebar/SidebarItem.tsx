import { ActiveTab } from '@/features/sidebar';
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
  const isActive = activeTab === tab;

  return (
    <li>
      <button
        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
        onClick={() => onTabClick(tab)}
        onKeyDown={(e) => onKeyDown(e, tab)}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </button>
    </li>
  );
};


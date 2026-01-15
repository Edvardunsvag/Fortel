import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectActiveTab, ActiveTab } from "@/features/sidebar/navigationSlice";
import { selectAccount } from "@/features/auth/authSlice";
import { SidebarItem } from "./SidebarItem";
import { LanguageToggle } from "../LanguageToggle/LanguageToggle";
import { LoginButton } from "../LoginButton/LoginButton";
import { AdminButton } from "../AdminButton/AdminButton";
import { tabToRoute } from "@/shared/routes";
import styles from "./Sidebar.module.scss";

export const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeTab = useAppSelector(selectActiveTab);
  const account = useAppSelector(selectAccount);

  const handleTabClick = (tab: ActiveTab) => {
    const route = tabToRoute[tab];
    if (route) {
      navigate(route);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, tab: ActiveTab) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTabClick(tab);
    }
  };

  return (
    <nav className={styles.sidebar} aria-label="Main navigation">
      <div className={styles.logoContainer}>
        <img src="/forte-logo.svg" alt="Forte" className={styles.logo} />
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
          label={t("sidebar.fortedle")}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
        <SidebarItem
          tab={ActiveTab.Lottery}
          icon="⏰"
          label={t("sidebar.lottery")}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
        <SidebarItem
          tab={ActiveTab.TimeBank}
          icon="🏦"
          label={t("sidebar.timebank")}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onKeyDown={handleKeyDown}
        />
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

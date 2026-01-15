import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { selectAccount } from "@/features/auth/authSlice";
import { isAdminAccount } from "@/shared/config/adminConfig";
import { GameSubTab, setActiveSubTab, selectActiveSubTab } from "@/features/game/gameSlice";
import { routes } from "@/shared/routes";
import styles from "./GameNavigationChips.module.scss";

const subTabToRoute: Record<GameSubTab, string> = {
  [GameSubTab.Play]: routes.play,
  [GameSubTab.Leaderboard]: routes.leaderboard,
  [GameSubTab.Rules]: routes.rules,
  [GameSubTab.Employees]: routes.employees,
  [GameSubTab.Sync]: routes.sync,
};

const subTabToTranslationKey: Record<GameSubTab, string> = {
  [GameSubTab.Play]: "sidebar.fortedle",
  [GameSubTab.Leaderboard]: "sidebar.leaderboard",
  [GameSubTab.Rules]: "sidebar.rules",
  [GameSubTab.Employees]: "sidebar.employees",
  [GameSubTab.Sync]: "sidebar.sync",
};

const subTabToIcon: Record<GameSubTab, string> = {
  [GameSubTab.Play]: "🎮",
  [GameSubTab.Leaderboard]: "🏆",
  [GameSubTab.Rules]: "📖",
  [GameSubTab.Employees]: "👥",
  [GameSubTab.Sync]: "🔄",
};

export const GameNavigationChips = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const activeSubTab = useAppSelector(selectActiveSubTab);
  const account = useAppSelector(selectAccount);
  const isAdmin = isAdminAccount(account?.username);
  const navRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const handleChipClick = (subTab: GameSubTab) => {
    const route = subTabToRoute[subTab];
    if (route) {
      dispatch(setActiveSubTab(subTab));
      navigate(route);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, subTab: GameSubTab) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleChipClick(subTab);
    }
  };

  const subTabs: GameSubTab[] = [
    GameSubTab.Play,
    GameSubTab.Leaderboard,
    GameSubTab.Rules,
    GameSubTab.Employees,
    ...(isAdmin ? [GameSubTab.Sync] : []),
  ];

  // Update slider position when active tab changes
  useEffect(() => {
    if (navRef.current) {
      const activeButton = navRef.current.querySelector(`[data-tab="${activeSubTab}"]`) as HTMLElement;
      if (activeButton) {
        setSliderStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth,
        });
        // Enable transitions after initial position is set
        if (!isInitialized) {
          requestAnimationFrame(() => setIsInitialized(true));
        }
      }
    }
  }, [activeSubTab, isInitialized]);

  return (
    <nav ref={navRef} className={styles.navigationChips} aria-label="Game navigation">
      {sliderStyle.width > 0 && (
        <div
          className={`${styles.slider} ${isInitialized ? styles.animated : ""}`}
          style={{
            transform: `translateX(${sliderStyle.left}px)`,
            width: `${sliderStyle.width}px`,
          }}
        />
      )}
      {subTabs.map((subTab) => {
        const isActive = activeSubTab === subTab;
        return (
          <button
            key={subTab}
            type="button"
            data-tab={subTab}
            className={`${styles.chip} ${isActive ? styles.active : ""}`}
            onClick={() => handleChipClick(subTab)}
            onKeyDown={(e) => handleKeyDown(e, subTab)}
            aria-label={t(subTabToTranslationKey[subTab])}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.icon} aria-hidden="true">
              {subTabToIcon[subTab]}
            </span>
            <span className={styles.label}>{t(subTabToTranslationKey[subTab])}</span>
          </button>
        );
      })}
    </nav>
  );
};

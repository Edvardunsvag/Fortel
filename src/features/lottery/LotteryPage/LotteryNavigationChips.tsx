import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { LotterySubTab, setActiveSubTab, selectActiveLotterySubTab } from "../lotterySlice";
import styles from "./LotteryNavigationChips.module.scss";

const subTabToTranslationKey: Record<LotterySubTab, string> = {
  [LotterySubTab.TimeEntries]: "lottery.navigation.timeEntries",
  [LotterySubTab.Rules]: "lottery.navigation.rules",
  [LotterySubTab.Lottery]: "lottery.navigation.lottery",
  [LotterySubTab.Employees]: "lottery.navigation.employees",
  [LotterySubTab.LuckyWheel]: "lottery.navigation.luckyWheel",
};

const subTabToIcon: Record<LotterySubTab, string> = {
  [LotterySubTab.TimeEntries]: "⏱️",
  [LotterySubTab.Rules]: "📖",
  [LotterySubTab.Lottery]: "🎫",
  [LotterySubTab.Employees]: "👥",
  [LotterySubTab.LuckyWheel]: "🎡",
};

export const LotteryNavigationChips = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeSubTab = useAppSelector(selectActiveLotterySubTab);
  const navRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const handleChipClick = (subTab: LotterySubTab) => {
    dispatch(setActiveSubTab(subTab));
  };

  const handleKeyDown = (event: React.KeyboardEvent, subTab: LotterySubTab) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleChipClick(subTab);
    }
  };

  const subTabs: LotterySubTab[] = [
    LotterySubTab.TimeEntries,
    LotterySubTab.Rules,
    LotterySubTab.Lottery,
    LotterySubTab.Employees,
    LotterySubTab.LuckyWheel,
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
    <nav ref={navRef} className={styles.navigationChips} aria-label="Lottery navigation">
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

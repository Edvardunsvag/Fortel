import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./TimeBankNavigationChips.module.scss";

export enum TimeBankSubTab {
  Data = "data",
  Rules = "rules",
}

interface TimeBankNavigationChipsProps {
  activeTab: TimeBankSubTab;
  onTabChange: (tab: TimeBankSubTab) => void;
}

const subTabToTranslationKey: Record<TimeBankSubTab, string> = {
  [TimeBankSubTab.Data]: "timebank.navigation.data",
  [TimeBankSubTab.Rules]: "timebank.navigation.rules",
};

const subTabToIcon: Record<TimeBankSubTab, string> = {
  [TimeBankSubTab.Data]: "📊",
  [TimeBankSubTab.Rules]: "📖",
};

export const TimeBankNavigationChips = ({ activeTab, onTabChange }: TimeBankNavigationChipsProps) => {
  const { t } = useTranslation();
  const navRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent, subTab: TimeBankSubTab) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTabChange(subTab);
    }
  };

  const subTabs: TimeBankSubTab[] = [TimeBankSubTab.Data, TimeBankSubTab.Rules];

  // Update slider position when active tab changes
  useEffect(() => {
    if (navRef.current) {
      const activeButton = navRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
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
  }, [activeTab, isInitialized]);

  return (
    <nav ref={navRef} className={styles.navigationChips} aria-label="Time Bank navigation">
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
        const isActive = activeTab === subTab;
        return (
          <button
            key={subTab}
            type="button"
            data-tab={subTab}
            className={`${styles.chip} ${isActive ? styles.active : ""}`}
            onClick={() => onTabChange(subTab)}
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

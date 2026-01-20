import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { AdminSubTab, setAdminSubTab, selectAdminSubTab } from "../adminSlice";
import styles from "./AdminNavigationChips.module.scss";

const subTabToTranslationKey: Record<AdminSubTab, string> = {
  [AdminSubTab.EmployeeOfTheDay]: "admin.navigation.employeeOfTheDay",
  [AdminSubTab.Logging]: "admin.navigation.logging",
  [AdminSubTab.Lottery]: "admin.navigation.lottery",
};

const subTabToIcon: Record<AdminSubTab, string> = {
  [AdminSubTab.EmployeeOfTheDay]: "🎯",
  [AdminSubTab.Logging]: "📋",
  [AdminSubTab.Lottery]: "🎁",
};

export const AdminNavigationChips = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeSubTab = useAppSelector(selectAdminSubTab);
  const navRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const handleChipClick = (subTab: AdminSubTab) => {
    dispatch(setAdminSubTab(subTab));
  };

  const handleKeyDown = (event: React.KeyboardEvent, subTab: AdminSubTab) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleChipClick(subTab);
    }
  };

  const subTabs: AdminSubTab[] = [
    AdminSubTab.EmployeeOfTheDay,
    AdminSubTab.Logging,
    AdminSubTab.Lottery,
  ];

  useEffect(() => {
    if (navRef.current) {
      const activeButton = navRef.current.querySelector(`[data-tab="${activeSubTab}"]`) as HTMLElement;
      if (activeButton) {
        setSliderStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth,
        });
        if (!isInitialized) {
          requestAnimationFrame(() => setIsInitialized(true));
        }
      }
    }
  }, [activeSubTab, isInitialized]);

  return (
    <nav ref={navRef} className={styles.navigationChips} aria-label="Admin navigation">
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

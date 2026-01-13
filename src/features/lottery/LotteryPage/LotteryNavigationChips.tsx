import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { LotterySubTab, setActiveSubTab, selectActiveLotterySubTab } from "../lotterySlice";
import styles from "./LotteryNavigationChips.module.scss";

const subTabToTranslationKey: Record<LotterySubTab, string> = {
  [LotterySubTab.TimeEntries]: "lottery.navigation.timeEntries",
  [LotterySubTab.Rules]: "lottery.navigation.rules",
  [LotterySubTab.Lottery]: "lottery.navigation.lottery",
};

const subTabToIcon: Record<LotterySubTab, string> = {
  [LotterySubTab.TimeEntries]: "⏱️",
  [LotterySubTab.Rules]: "📖",
  [LotterySubTab.Lottery]: "🎫",
};

export const LotteryNavigationChips = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeSubTab = useAppSelector(selectActiveLotterySubTab);

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
  ];

  return (
    <nav className={styles.navigationChips} aria-label="Lottery navigation">
      {subTabs.map((subTab) => {
        const isActive = activeSubTab === subTab;
        return (
          <button
            key={subTab}
            type="button"
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

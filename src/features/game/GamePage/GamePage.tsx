import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/app/hooks";
import { GameSubTab, selectActiveSubTab } from "@/features/game/gameSlice";
import { Game } from "../Game/Game";
import { LeaderboardPage } from "../leaderboard/LeaderboardPage/LeaderboardPage";
import { RulesPage } from "../RulesPage/RulesPage";
import { EmployeesPage } from "../employees/EmployeesPage/EmployeesPage";
import { GameNavigationChips } from "../Game/GameNavigationChips";
import styles from "./GamePage.module.scss";

export const GamePage = () => {
  const { t } = useTranslation();
  const activeSubTab = useAppSelector(selectActiveSubTab);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("game.title")}</h1>
        <GameNavigationChips />

        {/* Conditionally render page content based on active tab */}
        {activeSubTab === GameSubTab.Play && <Game />}
        {activeSubTab === GameSubTab.Leaderboard && <LeaderboardPage />}
        {activeSubTab === GameSubTab.Rules && <RulesPage />}
        {activeSubTab === GameSubTab.Employees && <EmployeesPage />}
      </div>
    </div>
  );
};

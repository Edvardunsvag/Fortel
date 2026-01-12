import { useAppSelector } from "@/app/hooks";
import type { Employee } from "@/features/employees/types";
import { selectFunfactRevealed } from "@/features/game/gameSlice";
import { findEmployeeByHash } from "@/shared/utils/hashUtils";
import { getTodayDateString } from "@/shared/utils/dateUtils";
import { useTranslation } from "react-i18next";
import styles from "./Game.module.scss";

interface FunfactRevealProps {
  employeeOfTheDayId: string;
  employees: Employee[];
}

export const FunfactReveal = ({ employeeOfTheDayId, employees }: FunfactRevealProps) => {
  const { t } = useTranslation();
  const funfactRevealed = useAppSelector(selectFunfactRevealed);

  if (!funfactRevealed) {
    return null;
  }

  const today = getTodayDateString();
  const targetEmployee = findEmployeeByHash<Employee>(employees, employeeOfTheDayId, today);

  if (!targetEmployee) {
    return null;
  }

  const targetFunfact = targetEmployee.funfact || null;
  const targetInterests = targetEmployee.interests || [];
  const hasNoFunfactOrInterests = !targetFunfact && (!targetInterests || targetInterests.length === 0);

  return (
    <div className={styles.funfactClueContainer}>
      {hasNoFunfactOrInterests ? (
        <p className={`${styles.funfactClueText} ${styles.funfactClueTextNoContent}`}>
          {t("game.noFunfactOrInterests")}
        </p>
      ) : (
        <>
          <h3 className={styles.funfactClueTitle}>{t("guessList.funfactClue")}</h3>
          {targetFunfact && <p className={styles.funfactClueText}>{targetFunfact}</p>}
          {targetInterests.length > 0 && (
            <div className={styles.interestsContainer}>
              <h4 className={styles.interestsTitle}>{t("guessList.interests")}</h4>
              <div className={styles.interestsList}>
                {targetInterests.map((interest: string, index: number) => (
                  <span key={index} className={styles.interestTag}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

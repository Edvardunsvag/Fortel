import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectEmployeeOfTheDayId,
  selectFunfactRevealed,
  selectRoundId,
  revealFunfact,
  loadRoundFromState,
  setHasFunfactOrInterests,
} from "@/features/game/gameSlice";
import { useRevealFunfact } from "@/features/game/queries";
import { toRevealFunfactRequest } from "@/features/game/toDto";
import { findEmployeeByHash } from "@/shared/utils/hashUtils";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Game.module.scss";
import { Employee } from "../employees";

interface FunfactRevealProps {
  employees: Employee[];
}

export const FunfactReveal = ({ employees }: FunfactRevealProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const employeeOfTheDayId = useAppSelector(selectEmployeeOfTheDayId);
  const funfactRevealed = useAppSelector(selectFunfactRevealed);
  const roundId = useAppSelector(selectRoundId);
  const revealFunfactMutation = useRevealFunfact();

  // Calculate hasFunfactOrInterests - must be done before any early returns
  const targetEmployee = employeeOfTheDayId ? findEmployeeByHash<Employee>(employees, employeeOfTheDayId) : null;

  const hasFunfactOrInterests = targetEmployee
    ? !(!targetEmployee.funfact && (!targetEmployee.interests || targetEmployee.interests.length === 0))
    : null;

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (hasFunfactOrInterests !== null) {
      dispatch(setHasFunfactOrInterests(hasFunfactOrInterests));
    }
  }, [dispatch, hasFunfactOrInterests]);

  const handleRevealFunfact = () => {
    if (!roundId) {
      return;
    }

    // Update local state
    dispatch(revealFunfact());

    // Save to server
    const request = toRevealFunfactRequest(roundId);
    revealFunfactMutation.mutate(request, {
      onSuccess: (round) => {
        dispatch(loadRoundFromState({ round }));
      },
    });
  };

  // Now we can do early returns after all hooks
  if (!employeeOfTheDayId) {
    return null;
  }

  if (!targetEmployee) {
    return null;
  }

  const targetFunfact = targetEmployee.funfact || null;
  const targetInterests = targetEmployee.interests || [];
  const hasNoFunfactOrInterests = !targetFunfact && (!targetInterests || targetInterests.length === 0);

  return (
    <div className={styles.funfactRevealWrapper}>
      {!funfactRevealed && (
        <button className={styles.revealFunfactButton} onClick={handleRevealFunfact} type="button">
          {t("game.buyInterests")}
        </button>
      )}
      <div className={`${styles.funfactClueContainer} ${!funfactRevealed ? styles.blurred : ""}`}>
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
    </div>
  );
};

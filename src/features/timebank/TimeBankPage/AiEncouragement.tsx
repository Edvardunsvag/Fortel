import { useTranslation } from "react-i18next";
import { useEmployees } from "@/features/game/employees/queries";
import type { TimeBalance } from "../types";
import type { FagtimerBalance } from "../timebankUtils";
import { useAiEncouragement } from "./useAiEncouragement";
import styles from "./TimeBankPage.module.scss";

const EDDI_EMAIL = "edvard.unsvag@fortedigital.com";
const EDDI_FIRST_NAME = "Edvard";
const EDDI_SURNAME = "Unsvåg";

interface AiEncouragementProps {
  timeBalance: TimeBalance;
  fagtimerBalance: FagtimerBalance;
}

export const AiEncouragement = ({ timeBalance, fagtimerBalance }: AiEncouragementProps) => {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  const { data: employees = [] } = useEmployees();

  const eddiAvatar =
    employees.find((e) => e.email?.toLowerCase() === EDDI_EMAIL)?.avatarImageUrl ||
    employees.find((e) => e.firstName === EDDI_FIRST_NAME && e.surname === EDDI_SURNAME)?.avatarImageUrl;

  const { message, isLoading, isPlaying, isTtsLoading, togglePlayback } = useAiEncouragement({
    timeBalance,
    fagtimerBalance,
    isNorwegian,
  });

  if (!message && !isLoading) return null;

  return (
    <div className={styles.aiEncouragement}>
      <div className={styles.aiEncouragementHeader}>
        {eddiAvatar ? (
          <img src={eddiAvatar} alt="Eddi" className={styles.aiEncouragementAvatar} />
        ) : (
          <span className={styles.aiEncouragementIcon}>🎭</span>
        )}
        <span className={styles.aiEncouragementTitle}>Eddi</span>
        {message && !isLoading && (
          <button
            className={styles.aiEncouragementPlayButton}
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isTtsLoading}
          >
            {isTtsLoading ? "⏳" : isPlaying ? "⏸️" : "🔊"}
          </button>
        )}
      </div>
      <div className={styles.aiEncouragementContent}>
        <p className={styles.aiEncouragementMessage}>
          {message}
          {isLoading && <span className={styles.aiEncouragementTyping}>▌</span>}
        </p>
      </div>
    </div>
  );
};

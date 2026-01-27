import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import styles from "./ConnectToHarvest.module.scss";
import { useHarvestTokenStatus } from "../queries";

interface ConnectToHarvestProps {
  error?: string;
  isLoading: boolean;
  onLogin: () => void;
  onTestApi: () => void;
}

export const ConnectToHarvest = ({ error, isLoading, onLogin, onTestApi }: ConnectToHarvestProps) => {
  const { t } = useTranslation();
  const { data: harvestStatus } = useHarvestTokenStatus();
  const isAuthenticated = harvestStatus?.is_authenticated ?? false;
  
  return (
    <div className={styles.loginForm}>
      <p className={styles.description}>{t("lottery.description")}</p>

      {error && <div className={styles.error}>{error}</div>}

      <button onClick={onLogin} className={styles.button} disabled={isLoading} type="button">
        {isLoading ? (
          <span className={styles.buttonContent}>
            <LoadingSpinner size="small" />
            {t("lottery.connecting")}
          </span>
        ) : (
          t("lottery.connect")
        )}
      </button>

      {isAuthenticated && (
        <div className={styles.testSection}>
          <p className={styles.testDescription}>Connected to Harvest! Test API calls:</p>
          <button onClick={onTestApi} className={styles.testButton} disabled={isLoading} type="button">
            {isLoading ? (
              <span className={styles.buttonContent}>
                <LoadingSpinner size="small" />
                Testing...
              </span>
            ) : (
              "Test API Calls"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

import { useTranslation } from "react-i18next";
import styles from "./ConnectToHarvest.module.scss";
import { selectLotteryToken } from "../lotterySlice";
import { useAppSelector } from "@/app/hooks";

interface ConnectToHarvestProps {
  error?: string;
  isLoading: boolean;
  onLogin: () => void;
  onTestApi: () => void;
}

export const ConnectToHarvest = ({ error, isLoading, onLogin, onTestApi }: ConnectToHarvestProps) => {
  const { t } = useTranslation();
  const token = useAppSelector(selectLotteryToken);
  return (
    <div className={styles.loginForm}>
      <p className={styles.description}>{t("lottery.description")}</p>

      {error && <div className={styles.error}>{error}</div>}

      <button onClick={onLogin} className={styles.button} disabled={isLoading} type="button">
        {isLoading ? t("lottery.connecting") : t("lottery.connect")}
      </button>

      {token && (
        <div className={styles.testSection}>
          <p className={styles.testDescription}>Token received! Test API calls:</p>
          <button onClick={onTestApi} className={styles.testButton} disabled={isLoading} type="button">
            {isLoading ? "Testing..." : "Test API Calls"}
          </button>
        </div>
      )}
    </div>
  );
};

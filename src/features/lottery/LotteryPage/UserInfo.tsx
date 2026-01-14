import { useTranslation } from "react-i18next";
import type { HarvestUser } from "../types";
import styles from "./UserInfo.module.scss";

interface UserInfoProps {
  user?: HarvestUser;
  weeklyDataLength: number;
  totalLotteryTickets: number;
  onLogout: () => void;
}

export const UserInfo = ({ user, weeklyDataLength, totalLotteryTickets, onLogout }: UserInfoProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.userInfo}>
      <div className={styles.userInfoHeader}>
        <h2 className={styles.userWelcome}>
          {t("lottery.welcome")}, {user?.first_name} {user?.last_name}!
        </h2>
        {weeklyDataLength > 0 && (
          <div className={styles.lotteryTicketsCount}>
            <span className={styles.ticketIcon}>🎫</span>
            <span className={styles.ticketCount}>{t("lottery.ticketsSaved", { count: totalLotteryTickets })}</span>
          </div>
        )}
      </div>
      <p>
        <strong>{t("lottery.email")}:</strong> {user?.email}
      </p>
      <p>
        <strong>{t("lottery.userId")}:</strong> {user?.id}
      </p>
      <button onClick={onLogout} className={styles.logoutButton} type="button">
        {t("lottery.disconnect")}
      </button>
    </div>
  );
};

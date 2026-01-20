import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectAccount } from "@/features/auth/authSlice";
import { isAdminAccount } from "@/shared/config/adminConfig";
import { routes } from "@/shared/routes";
import { AdminSubTab, selectAdminSubTab } from "../adminSlice";
import { AdminNavigationChips } from "./AdminNavigationChips";
import { EmployeeOfTheDay } from "../EmployeeOfTheDay/EmployeeOfTheDay";
import { LogViewer } from "../LogViewer/LogViewer";
import { LotteryAdmin } from "../LotteryAdmin/LotteryAdmin";
import styles from "./AdminPage.module.scss";

export const AdminPage = () => {
  const { t } = useTranslation();
  const account = useAppSelector(selectAccount);
  const isAdmin = isAdminAccount(account?.username);
  const activeSubTab = useAppSelector(selectAdminSubTab);

  if (!isAdmin) {
    return <Navigate to={routes.play} replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("admin.title")}</h1>
        <AdminNavigationChips />

        {activeSubTab === AdminSubTab.EmployeeOfTheDay && <EmployeeOfTheDay />}
        {activeSubTab === AdminSubTab.Logging && <LogViewer />}
        {activeSubTab === AdminSubTab.Lottery && <LotteryAdmin />}
      </div>
    </div>
  );
};

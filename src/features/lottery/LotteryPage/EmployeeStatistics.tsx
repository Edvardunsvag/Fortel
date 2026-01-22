import { useTranslation } from "react-i18next";
import { useEmployeeStatistics } from "../queries";
import styles from "./EmployeeStatistics.module.scss";

export const EmployeeStatistics = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useEmployeeStatistics();

  if (isLoading) {
    return (
      <div className={styles.dataSection}>
        <p className={styles.loading}>{t("lottery.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dataSection}>
        <p className={styles.error}>{error instanceof Error ? error.message : t("lottery.employees.error")}</p>
      </div>
    );
  }

  if (!data || !data.employees || data.employees.length === 0) {
    return (
      <div className={styles.dataSection}>
        <p className={styles.empty}>{t("lottery.employees.noEmployees")}</p>
      </div>
    );
  }

  return (
    <div className={styles.dataSection}>
      <h3>{t("lottery.employees.title")}</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankColumn}>{t("lottery.employees.rank")}</th>
              <th className={styles.employeeColumn}>{t("lottery.employees.employee")}</th>
              <th className={styles.ticketsColumn}>{t("lottery.employees.tickets")}</th>
              <th className={styles.winsColumn}>{t("lottery.employees.wins")}</th>
            </tr>
          </thead>
          <tbody>
            {data.employees.map((employee, index) => (
              <tr key={employee.userId}>
                <td className={styles.rankColumn}>
                  <span className={styles.rank}>{index + 1}</span>
                </td>
                <td className={styles.employeeColumn}>
                  <div className={styles.employeeInfo}>
                    {employee.image && (
                      <img src={employee.image ?? ""} alt={employee.name ?? ""} className={styles.avatar} loading="lazy" />
                    )}
                    <span className={styles.name}>{employee.name}</span>
                  </div>
                </td>
                <td className={styles.ticketsColumn}>
                  <span className={styles.count}>{employee.ticketCount}</span>
                </td>
                <td className={styles.winsColumn}>
                  <span className={`${styles.count} ${(employee.winCount ?? 0) > 0 ? styles.winner : ""}`}>
                    {employee.winCount ?? 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

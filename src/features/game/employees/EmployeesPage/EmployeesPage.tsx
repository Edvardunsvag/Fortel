import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./EmployeesPage.module.scss";
import { Employee } from "@/features/game/employees";
import { useEmployees } from "../queries";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

export const EmployeesPage = () => {
  const { t } = useTranslation();
  const { data: employees = [], isLoading, isError } = useEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId) || null;

  const handleEmployeeClick = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleEmployeeKeyDown = (event: React.KeyboardEvent, employeeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleEmployeeClick(employeeId);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t("employees.loading")} fullScreen />;
  }

  if (isError) {
    return <p className={styles.errorText}>{t("employees.failedToLoad")}</p>;
  }

  if (employees.length === 0) {
    return <p className={styles.emptyText}>{t("employees.noEmployees")}</p>;
  }

  return (
    <div className={styles.employeesLayout}>
        <div className={styles.employeeList}>
          <ul className={styles.list} role="listbox" aria-label="Employee list">
            {employees.map((employee) => (
              <li key={employee.id}>
                <button
                  className={`${styles.employeeItem} ${selectedEmployeeId === employee.id ? styles.selected : ""}`}
                  onClick={() => handleEmployeeClick(employee.id)}
                  onKeyDown={(e) => handleEmployeeKeyDown(e, employee.id)}
                  aria-label={`Select ${employee.name}`}
                  aria-selected={selectedEmployeeId === employee.id}
                  role="option"
                >
                  {employee.avatarImageUrl && !employee.avatarImageUrl.toLowerCase().includes("imagekit") ? (
                    <img src={employee.avatarImageUrl} alt={`${employee.name} avatar`} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {employee.firstName.charAt(0)}
                      {employee.surname.charAt(0)}
                    </div>
                  )}
                  <span className={styles.employeeName}>{employee.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.employeeDetails}>
          {selectedEmployee ? (
            <EmployeeDetails employee={selectedEmployee} />
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>{t("employees.selectEmployee")}...</p>
            </div>
          )}
        </div>
      </div>
  );
};

interface EmployeeDetailsProps {
  employee: Employee;
}

const EmployeeDetails = ({ employee }: EmployeeDetailsProps) => {
  const { t } = useTranslation();

  const shouldShowPlaceholder = !employee.avatarImageUrl || employee.avatarImageUrl.toLowerCase().includes("imagekit");

  return (
    <div className={styles.detailsContent}>
      <div className={styles.detailsHeader}>
        {shouldShowPlaceholder ? (
          <div className={styles.detailsAvatarPlaceholder}>
            {employee.firstName.charAt(0)}
            {employee.surname.charAt(0)}
          </div>
        ) : (
          <img src={employee.avatarImageUrl} alt={`${employee.name} avatar`} className={styles.detailsAvatar} />
        )}
        <h2 className={styles.detailsName}>{employee.name}</h2>
      </div>

      <div className={styles.detailsSection}>
        <h3 className={styles.sectionTitle}>{t("employees.personalInformation")}</h3>
        <dl className={styles.detailsList}>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t("employees.firstName")}</dt>
            <dd className={styles.detailValue}>{employee.firstName}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t("employees.surname")}</dt>
            <dd className={styles.detailValue}>{employee.surname}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t("employees.age")}</dt>
            <dd className={styles.detailValue}>{employee.age}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.detailsSection}>
        <h3 className={styles.sectionTitle}>{t("employees.workInformation")}</h3>
        <dl className={styles.detailsList}>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t("employees.department")}</dt>
            <dd className={styles.detailValue}>{employee.department}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t("employees.office")}</dt>
            <dd className={styles.detailValue}>{employee.office}</dd>
          </div>
          {employee.supervisor && (
            <div className={styles.detailItem}>
              <dt className={styles.detailLabel}>{t("employees.supervisor")}</dt>
              <dd className={styles.detailValue}>{employee.supervisor} {employee.supervisorLastname}</dd>
            </div>
          )}
          {employee.stillingstittel && (
            <div className={styles.detailItem}>
              <dt className={styles.detailLabel}>{t("employees.stillingstittel")}</dt>
              <dd className={styles.detailValue}>{employee.stillingstittel}</dd>
            </div>
          )}
        </dl>
      </div>

      {employee.teams && employee.teams.length > 0 && (
        <div className={styles.detailsSection}>
          <h3 className={styles.sectionTitle}>{t("employees.teams")}</h3>
          <ul className={styles.teamsList}>
            {employee.teams.map((team, index) => (
              <li key={index} className={styles.teamItem}>
                {team}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectEmployees, selectEmployeesStatus } from '@/features/employees';
import type { Employee } from '@/features/employees/types';
import { AsyncStatus } from '@/shared/redux/enums';
import styles from './Employees.module.scss';

export const Employees = () => {
  const { t } = useTranslation();
  const employees = useAppSelector(selectEmployees);
  const status = useAppSelector(selectEmployeesStatus);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId) || null;

  const handleEmployeeClick = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleEmployeeKeyDown = (event: React.KeyboardEvent, employeeId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleEmployeeClick(employeeId);
    }
  };

  if (status === AsyncStatus.Loading) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('employees.title')}</h1>
          <p className={styles.loadingText}>{t('employees.loading')}</p>
        </div>
      </div>
    );
  }

  if (status === AsyncStatus.Failed) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('employees.title')}</h1>
          <p className={styles.errorText}>{t('employees.failedToLoad')}</p>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('employees.title')}</h1>
          <p className={styles.emptyText}>{t('employees.noEmployees')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContent}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('employees.title')}</h1>
      </div>
      <div className={styles.employeesLayout}>
        <div className={styles.employeeList}>
          <ul className={styles.list} role="listbox" aria-label="Employee list">
            {employees.map((employee) => (
              <li key={employee.id}>
                <button
                  className={`${styles.employeeItem} ${
                    selectedEmployeeId === employee.id ? styles.selected : ''
                  }`}
                  onClick={() => handleEmployeeClick(employee.id)}
                  onKeyDown={(e) => handleEmployeeKeyDown(e, employee.id)}
                  aria-label={`Select ${employee.name}`}
                  aria-selected={selectedEmployeeId === employee.id}
                  role="option"
                >
                  {employee.avatarImageUrl ? (
                    <img
                      src={employee.avatarImageUrl}
                      alt={`${employee.name} avatar`}
                      className={styles.avatar}
                    />
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
              <p className={styles.emptyStateText}>{t('employees.selectEmployee')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface EmployeeDetailsProps {
  employee: Employee;
}

const EmployeeDetails = ({ employee }: EmployeeDetailsProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.detailsContent}>
      <div className={styles.detailsHeader}>
        {employee.avatarImageUrl ? (
          <img
            src={employee.avatarImageUrl}
            alt={`${employee.name} avatar`}
            className={styles.detailsAvatar}
          />
        ) : (
          <div className={styles.detailsAvatarPlaceholder}>
            {employee.firstName.charAt(0)}
            {employee.surname.charAt(0)}
          </div>
        )}
        <h2 className={styles.detailsName}>{employee.name}</h2>
      </div>

      <div className={styles.detailsSection}>
        <h3 className={styles.sectionTitle}>{t('employees.personalInformation')}</h3>
        <dl className={styles.detailsList}>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t('employees.firstName')}</dt>
            <dd className={styles.detailValue}>{employee.firstName}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t('employees.surname')}</dt>
            <dd className={styles.detailValue}>{employee.surname}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t('employees.age')}</dt>
            <dd className={styles.detailValue}>{employee.age}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.detailsSection}>
        <h3 className={styles.sectionTitle}>{t('employees.workInformation')}</h3>
        <dl className={styles.detailsList}>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t('employees.department')}</dt>
            <dd className={styles.detailValue}>{employee.department}</dd>
          </div>
          <div className={styles.detailItem}>
            <dt className={styles.detailLabel}>{t('employees.office')}</dt>
            <dd className={styles.detailValue}>{employee.office}</dd>
          </div>
          {employee.supervisor && (
            <div className={styles.detailItem}>
              <dt className={styles.detailLabel}>{t('employees.supervisor')}</dt>
              <dd className={styles.detailValue}>{employee.supervisor}</dd>
            </div>
          )}
        </dl>
      </div>

      {employee.teams && employee.teams.length > 0 && (
        <div className={styles.detailsSection}>
          <h3 className={styles.sectionTitle}>{t('employees.teams')}</h3>
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


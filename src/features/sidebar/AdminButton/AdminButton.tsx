import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectAccount } from '@/features/auth/authSlice';
import { selectEmployees } from '@/features/employees/employeesSlice';
import { initializeGame } from '@/features/game/gameSlice';
import { ADMIN_ACCOUNT } from '@/shared/config/adminConfig';
import styles from './AdminButton.module.scss';

export const AdminButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const account = useAppSelector(selectAccount);
  const employees = useAppSelector(selectEmployees);

  const isAdmin = account?.username === ADMIN_ACCOUNT;

  if (!isAdmin) {
    return null;
  }

  const handleChangeEmployee = () => {
    if (employees.length === 0) {
      return;
    }

    // Randomly select a new employee
    const randomIndex = Math.floor(Math.random() * employees.length);
    const selectedEmployee = employees[randomIndex];
    console.log('selectedEmployee', selectedEmployee);

    if (selectedEmployee) {
      dispatch(initializeGame(selectedEmployee.id));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleChangeEmployee();
    }
  };

  return (
    <button
      className={styles.adminButton}
      onClick={handleChangeEmployee}
      onKeyDown={handleKeyDown}
      type="button"
      aria-label={t('admin.changeEmployee')}
      title={t('admin.changeEmployee')}
    >
      🔄 {t('admin.changeEmployee')}
    </button>
  );
};


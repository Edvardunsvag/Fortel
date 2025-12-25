import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { selectActiveTab, ActiveTab } from './features/navigation';
import { selectEmployees, selectEmployeesStatus, loadEmployees } from './features/employees';
import Sidebar from './components/Sidebar/Sidebar';
import Login from './components/Auth/Login';
import Play from './components/Pages/Play';
import Leaderboard from './components/Pages/Leaderboard';
import Rules from './components/Pages/Rules';
import styles from './App.module.scss';

const App = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectActiveTab);
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const hasEmployees = employees.length > 0 && employeesStatus === 'succeeded';

  useEffect(() => {
    // Try to load employees from database on mount only
    // Only load if status is 'idle' (initial state) and we haven't loaded yet
    if (employeesStatus === 'idle' && employees.length === 0) {
      dispatch(loadEmployees());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const renderPage = () => {
    switch (activeTab) {
      case ActiveTab.Play:
        return <Play />;
      case ActiveTab.Leaderboard:
        return <Leaderboard />;
      case ActiveTab.Rules:
        return <Rules />;
      default:
        return <Play />;
    }
  };

  return (
    <div className={styles.app}>
      {!hasEmployees && <Login />}
      {hasEmployees && (
        <>
          <Sidebar />
          {renderPage()}
        </>
      )}
    </div>
  );
};

export default App;


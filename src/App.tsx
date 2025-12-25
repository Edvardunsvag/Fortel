import { useAppSelector } from './app/hooks';
import { selectActiveTab, ActiveTab } from './features/navigation';
import Sidebar from './components/Sidebar/Sidebar';
import Play from './components/Pages/Play';
import Leaderboard from './components/Pages/Leaderboard';
import Rules from './components/Pages/Rules';
import styles from './App.module.scss';

const App = () => {
  const activeTab = useAppSelector(selectActiveTab);

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
      <Sidebar />
      {renderPage()}
    </div>
  );
};

export default App;


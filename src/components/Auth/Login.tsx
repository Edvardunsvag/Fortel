import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectEmployees, selectEmployeesStatus, loadEmployees } from '@/features/employees';
import styles from './Login.module.scss';

const Login = () => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectEmployees);
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const hasEmployees = employees.length > 0 && employeesStatus === 'succeeded';
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Clear sync success message when employees are loaded
  useEffect(() => {
    if (hasEmployees && syncSuccess) {
      setSyncSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEmployees]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncSuccess(false);

    if (!tokenInput.trim()) {
      setError('Please enter an access token');
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: tokenInput.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync data');
      }

      const result = await response.json();
      console.log('Sync successful:', result);
      setSyncSuccess(true);
      setTokenInput('');
      
      // Load employees after successful sync
      console.log('Loading employees from database...');
      const loadResult = await dispatch(loadEmployees());
      
      // Check if loading failed
      if (loadEmployees.rejected.match(loadResult)) {
        console.error('Failed to load employees:', loadResult);
        setError('Data synced successfully, but failed to load employees. Please refresh the page.');
        setSyncSuccess(false);
      } else {
        console.log('Employees loaded successfully');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync data. Please try again.');
      setSyncSuccess(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSync(e);
    }
  };

  const handlePaste = () => {
    // Allow paste to work normally - the onChange handler will update the state
    // This handler is here to ensure paste events are not blocked
  };

  if (hasEmployees) {
    return null; // Don't show sync if employees are already loaded
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Data Sync</h1>
        <p className={styles.description}>
          Enter your Huma access token to sync employee data to the database.
        </p>
        
        <form onSubmit={handleSync} className={styles.tokenForm}>
          <label htmlFor="token-input" className={styles.tokenLabel}>
            Access Token
          </label>
          <textarea
            id="token-input"
            className={styles.tokenInput}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Paste your Huma access token here (Ctrl+V or Cmd+V)..."
            rows={4}
            disabled={isSyncing}
          />
          {error && <p className={styles.error}>{error}</p>}
          {syncSuccess && (
            <p className={styles.success}>
              Data synced successfully! The game is now ready to play.
            </p>
          )}
          <div className={styles.tokenActions}>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={isSyncing || !tokenInput.trim()}
            >
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
          <p className={styles.instructions}>
            <strong>How to get your token:</strong>
            <br />
            1. Open Developer Tools (F12)
            <br />
            2. Go to Application → Local Storage → https://fortedigital.humahr.com
            <br />
            3. Find the key <code>huma:accessToken</code>
            <br />
            4. Copy the value (it may be in array format like <code>["token"]</code>)
            <br />
            5. Paste it here and click "Sync Data"
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;


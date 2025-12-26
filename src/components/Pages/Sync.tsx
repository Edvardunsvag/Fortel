import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { syncEmployeesData, selectEmployeesStatus } from '@/features/employees';
import styles from './Pages.module.scss';

export const Sync = () => {
  const dispatch = useAppDispatch();
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const isSyncing = employeesStatus === 'loading';

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncSuccess(false);

    if (!tokenInput.trim()) {
      setError('Please enter an access token');
      return;
    }

    try {
      const result = await dispatch(syncEmployeesData(tokenInput.trim()));
      
      if (syncEmployeesData.fulfilled.match(result)) {
        setSyncSuccess(true);
        setTokenInput('');
      } else if (syncEmployeesData.rejected.match(result)) {
        setError(result.payload as string || 'Failed to sync data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync data. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.container}>
        <h1 className={styles.title}>Data Sync</h1>
        <p className={styles.subtitle}>
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
            placeholder="Paste your Huma access token here (Ctrl+V or Cmd+V)..."
            rows={4}
            disabled={isSyncing}
          />
          {error && <p className={styles.error}>{error}</p>}
          {syncSuccess && (
            <p className={styles.success}>
              Data synced successfully! {employeesStatus === 'succeeded' && 'Employees have been loaded.'}
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


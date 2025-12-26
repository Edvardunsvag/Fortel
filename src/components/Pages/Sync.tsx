import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { syncEmployeesData, selectEmployeesStatus } from '@/features/employees';
import { useMsalAuth, selectIsAuthenticated } from '@/features/auth';
import styles from './Pages.module.scss';

export const Sync = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const employeesStatus = useAppSelector(selectEmployeesStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { getAccessToken } = useMsalAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const isSyncing = employeesStatus === 'loading';

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncSuccess(false);

    let accessToken: string | null = null;

    // Try to use MSAL token if authenticated, otherwise use manual input
    if (isAuthenticated) {
      accessToken = await getAccessToken();
      if (!accessToken) {
        setError(t('sync.failedToGetToken'));
        return;
      }
    } else {
      if (!tokenInput.trim()) {
        setError(t('sync.pleaseEnterToken'));
        return;
      }
      accessToken = tokenInput.trim();
    }

    try {
      const result = await dispatch(syncEmployeesData(accessToken));
      
      if (syncEmployeesData.fulfilled.match(result)) {
        setSyncSuccess(true);
        setTokenInput('');
      } else if (syncEmployeesData.rejected.match(result)) {
        setError(result.payload as string || t('sync.failedToSync'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sync.failedToSync'));
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
        <h1 className={styles.title}>{t('sync.title')}</h1>
        <p className={styles.subtitle}>
          {isAuthenticated 
            ? t('sync.subtitleAuthenticated')
            : t('sync.subtitle')
          }
        </p>
        
        <form onSubmit={handleSync} className={styles.tokenForm}>
          {!isAuthenticated && (
            <>
              <label htmlFor="token-input" className={styles.tokenLabel}>
                {t('sync.accessToken')}
              </label>
              <textarea
                id="token-input"
                className={styles.tokenInput}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('sync.tokenPlaceholder')}
                rows={4}
                disabled={isSyncing}
              />
            </>
          )}
          {error && <p className={styles.error}>{error}</p>}
          {syncSuccess && (
            <p className={styles.success}>
              {t('sync.dataSynced')} {employeesStatus === 'succeeded' && t('sync.employeesLoaded')}
            </p>
          )}
          <div className={styles.tokenActions}>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={isSyncing || (!isAuthenticated && !tokenInput.trim())}
            >
              {isSyncing ? t('sync.syncing') : t('sync.syncData')}
            </button>
          </div>
          {!isAuthenticated && (
            <p className={styles.instructions}>
              <strong>{t('sync.howToGetToken')}</strong>
              <br />
              {t('sync.step1')}
              <br />
              {t('sync.step2')}
              <br />
              {t('sync.step3')}
              <br />
              {t('sync.step4')}
              <br />
              {t('sync.step5')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};


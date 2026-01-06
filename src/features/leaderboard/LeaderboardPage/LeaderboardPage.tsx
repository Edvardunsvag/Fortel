import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchLeaderboard,
  selectLeaderboard,
  selectLeaderboardStatus,
  selectLeaderboardError,
  selectSubmitStatus,
} from '@/features/leaderboard/leaderboardSlice';
import { AsyncStatus } from '@/shared/redux/enums';
import styles from './LeaderboardPage.module.scss';

export const LeaderboardPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const leaderboard = useAppSelector(selectLeaderboard);
  const status = useAppSelector(selectLeaderboardStatus);
  const error = useAppSelector(selectLeaderboardError);
  const submitStatus = useAppSelector(selectSubmitStatus);

  useEffect(() => {
    // Load leaderboard on mount
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  // Refresh leaderboard when a score is successfully submitted
  useEffect(() => {
    if (submitStatus === AsyncStatus.Succeeded) {
      dispatch(fetchLeaderboard());
    }
  }, [dispatch, submitStatus]);

  const handleRefresh = () => {
    dispatch(fetchLeaderboard());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const language = localStorage.getItem('fortedle_language') || 'en';
    const locale = language === 'nb' ? 'nb-NO' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === AsyncStatus.Loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('leaderboard.title')}</h1>
          <p className={styles.subtitle}>{t('leaderboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (status === AsyncStatus.Failed) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('leaderboard.title')}</h1>
          <p className={styles.subtitle} style={{ color: 'var(--color-error)' }}>
            {error || t('leaderboard.failedToLoad')}
          </p>
          <button
            onClick={handleRefresh}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-link-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            {t('leaderboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  const today = leaderboard?.date ? formatDate(leaderboard.date) : t('leaderboard.title');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('leaderboard.title')}</h1>
        <p className={styles.subtitle}>{today}</p>

        {leaderboard && leaderboard.leaderboard.length > 0 ? (
          <div className={styles.content}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '2rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--color-border-light)',
                  }}
                >
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-dark-fill)',
                    }}
                  >
                    {t('leaderboard.rank')}
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-dark-fill)',
                    }}
                  >
                    {t('leaderboard.name')}
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '1rem',
                      width: '80px',
                    }}
                  >
                    {/* Avatar column - no header text */}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-dark-fill)',
                    }}
                  >
                    {t('leaderboard.score')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.leaderboard.map((entry) => (
                  <tr
                    key={`${entry.name}-${entry.rank}`}
                    style={{
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <td
                      style={{
                        padding: '1rem',
                        color: 'var(--color-dark-fill)',
                      }}
                    >
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        color: 'var(--color-dark-fill)',
                        fontWeight: entry.rank <= 3 ? 600 : 400,
                      }}
                    >
                      {entry.name}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                      }}
                    >
                      {entry.avatarImageUrl ? (
                        <img
                          src={entry.avatarImageUrl}
                          alt={`${entry.name} avatar`}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-dark-fill)',
                            fontSize: '1.2rem',
                            fontWeight: 600,
                          }}
                        >
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        color: 'var(--color-dark-fill)',
                        fontWeight: entry.rank <= 3 ? 600 : 400,
                      }}
                    >
                      {entry.score} {entry.score === 1 ? t('game.guess') : t('game.guesses_plural')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.content}>
            <p className={styles.text}>
              {t('leaderboard.noScores')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


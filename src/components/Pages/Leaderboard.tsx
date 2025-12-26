import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchLeaderboard,
  selectLeaderboard,
  selectLeaderboardStatus,
  selectLeaderboardError,
  selectSubmitStatus,
} from '@/features/leaderboard';
import styles from './Pages.module.scss';

export const Leaderboard = () => {
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
    if (submitStatus === 'succeeded') {
      dispatch(fetchLeaderboard());
    }
  }, [dispatch, submitStatus]);

  const handleRefresh = () => {
    dispatch(fetchLeaderboard());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle} style={{ color: 'var(--color-error)' }}>
            {error || 'Failed to load leaderboard'}
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  const today = leaderboard?.date ? formatDate(leaderboard.date) : 'Today';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Leaderboard</h1>
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
                    Rank
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-dark-fill)',
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-dark-fill)',
                    }}
                  >
                    Score
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
                        textAlign: 'right',
                        color: 'var(--color-dark-fill)',
                        fontWeight: entry.rank <= 3 ? 600 : 400,
                      }}
                    >
                      {entry.score} {entry.score === 1 ? 'guess' : 'guesses'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.content}>
            <p className={styles.text}>
              No scores yet for today. Be the first to complete the challenge!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


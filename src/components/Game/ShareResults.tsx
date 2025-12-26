import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { submitScore, selectSubmitStatus, selectSubmitError, clearSubmitStatus } from '@/features/leaderboard';
import styles from './ShareResults.module.scss';

interface ShareResultsProps {
  guesses: number;
  isWon: boolean;
}

export const ShareResults = ({ guesses, isWon }: ShareResultsProps) => {
  const dispatch = useAppDispatch();
  const submitStatus = useAppSelector(selectSubmitStatus);
  const submitError = useAppSelector(selectSubmitError);
  const [userName, setUserName] = useState('');
  const [shareText, setShareText] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // Load user name from localStorage
    const savedName = localStorage.getItem('fortel_userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  useEffect(() => {
    if (userName) {
      const result = isWon
        ? `🎉 Fortel ${new Date().toLocaleDateString()} - ${guesses} guesses\n\nGuessed by ${userName}`
        : `Fortel ${new Date().toLocaleDateString()} - Attempted\n\nAttempted by ${userName}`;
      setShareText(result);
    } else {
      setShareText('');
    }
  }, [userName, guesses, isWon]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setUserName(name);
    localStorage.setItem('fortel_userName', name);
    // Clear submit status when name changes
    if (hasSubmitted) {
      dispatch(clearSubmitStatus());
      setHasSubmitted(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!isWon || !userName.trim() || hasSubmitted) {
      return;
    }

    try {
      await dispatch(submitScore({ name: userName.trim(), score: guesses })).unwrap();
      setHasSubmitted(true);
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };



  // Only show share results when game is won
  if (!isWon) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <label htmlFor="user-name" className={styles.label}>
          Your name:
        </label>
        <input
          id="user-name"
          type="text"
          value={userName}
          onChange={handleNameChange}
          placeholder="Enter your name"
          className={styles.input}
          maxLength={50}
        />
      </div>

      {isWon && (
        <div className={styles.submitSection}>
          {submitStatus === 'loading' && (
            <p className={styles.statusMessage}>Submitting score...</p>
          )}
          {submitStatus === 'succeeded' && hasSubmitted && (
            <p className={styles.successMessage}>✓ Score submitted to leaderboard!</p>
          )}
          {submitStatus === 'failed' && submitError && (
            <p className={styles.errorMessage}>Failed to submit: {submitError}</p>
          )}
        </div>
      )}

      {userName && shareText && (
        <div className={styles.shareSection}>
          {isWon && !hasSubmitted && (
            <button
              onClick={handleSubmitScore}
              className={styles.submitButton}
              disabled={submitStatus === 'loading' || !userName.trim()}
              aria-label="Submit score to leaderboard"
            >
              {submitStatus === 'loading' ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};


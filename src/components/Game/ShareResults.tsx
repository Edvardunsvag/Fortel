import { useState, useEffect } from 'react';
import styles from './ShareResults.module.scss';

interface ShareResultsProps {
  guesses: number;
  isWon: boolean;
}

const ShareResults = ({ guesses, isWon }: ShareResultsProps) => {
  const [userName, setUserName] = useState('');
  const [shareText, setShareText] = useState('');

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
        ? `🎉 Fortel ${new Date().toLocaleDateString()} - ${guesses}/6\n\nGuessed by ${userName}`
        : `Fortel ${new Date().toLocaleDateString()} - X/6\n\nAttempted by ${userName}`;
      setShareText(result);
    } else {
      setShareText('');
    }
  }, [userName, guesses, isWon]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setUserName(name);
    localStorage.setItem('fortel_userName', name);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      // Show temporary success message
      const button = document.activeElement as HTMLElement;
      const originalText = button.textContent;
      if (button) {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isWon && guesses < 6) {
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

      {userName && shareText && (
        <div className={styles.shareSection}>
          <div className={styles.resultPreview}>
            <pre className={styles.resultText}>{shareText}</pre>
          </div>
          <button
            onClick={handleCopy}
            className={styles.copyButton}
            aria-label="Copy results to clipboard"
          >
            Copy Results
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareResults;


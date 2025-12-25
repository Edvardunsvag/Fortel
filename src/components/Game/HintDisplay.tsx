import type { GuessHint, HintResult } from '@/features/game';
import styles from './HintDisplay.module.scss';

interface HintDisplayProps {
  hint: GuessHint;
}

const HintDisplay = ({ hint }: HintDisplayProps) => {
  const getResultClass = (result: HintResult): string => {
    switch (result) {
      case 'correct':
        return styles.correct;
      case 'partial':
        return styles.partial;
      case 'incorrect':
      case 'none':
      case 'lower':
        return styles.incorrect;
      case 'higher':
      case 'equal':
        return styles.neutral;
      default:
        return '';
    }
  };

  const getIcon = (result: HintResult): string => {
    switch (result) {
      case 'correct':
        return '✓';
      case 'partial':
        return '~';
      case 'incorrect':
      case 'none':
      case 'lower':
        return '✗';
      case 'higher':
        return '↑';
      case 'equal':
        return '=';
      default:
        return '';
    }
  };

  return (
    <div
      className={`${styles.hint} ${getResultClass(hint.result)}`}
      aria-label={`${hint.type}: ${hint.message}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {getIcon(hint.result)}
      </span>
      <span className={styles.type}>{hint.type}:</span>
      <span className={styles.message}>{hint.message}</span>
    </div>
  );
};

export default HintDisplay;


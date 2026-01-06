import { useTranslation } from 'react-i18next';
import { HintType, HintResult } from '@/features/game/types';
import type { GuessHint } from '@/features/game/types';
import styles from './HintDisplay.module.scss';

interface HintDisplayProps {
  hint: GuessHint;
}

const getHintTypeLabel = (type: HintType, t: (key: string) => string): string => {
  switch (type) {
    case HintType.Department:
      return t('hintDisplay.department');
    case HintType.Office:
      return t('hintDisplay.office');
    case HintType.Teams:
      return t('hintDisplay.teams');
    case HintType.Age:
      return t('hintDisplay.age');
    case HintType.Supervisor:
      return t('hintDisplay.supervisor');
    default:
      return type;
  }
};

export const HintDisplay = ({ hint }: HintDisplayProps) => {
  const { t } = useTranslation();
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

  const typeLabel = getHintTypeLabel(hint.type, t);

  return (
    <div
      className={`${styles.hint} ${getResultClass(hint.result)}`}
      aria-label={`${typeLabel}: ${hint.message}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {getIcon(hint.result)}
      </span>
      <span className={styles.type}>{typeLabel}:</span>
      <span className={styles.message}>{hint.message}</span>
    </div>
  );
};


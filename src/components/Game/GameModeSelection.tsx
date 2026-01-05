import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/app/hooks';
import { selectMode, GameMode } from '@/features/game';
import styles from './GameModeSelection.module.scss';
import pageStyles from '../Pages/Pages.module.scss';

export const GameModeSelection = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleModeSelect = (mode: GameMode) => {
    dispatch(selectMode(mode));
  };

  const handleKeyDown = (e: React.KeyboardEvent, mode: GameMode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleModeSelect(mode);
    }
  };

  return (
    <div className={pageStyles.container}>
      <h1 className={pageStyles.title}>{t('game.title')}</h1>
      <p className={pageStyles.subtitle}>{t('game.modeSelection.subtitle')}</p>
      
      <div className={styles.modesContainer}>
        <button
          className={styles.modeOption}
          onClick={() => handleModeSelect(GameMode.Classic)}
          onKeyDown={(e) => handleKeyDown(e, GameMode.Classic)}
          aria-label={t('game.modeSelection.classic.ariaLabel')}
        >
          <div className={styles.modeIcon}>
            <span className={styles.iconSymbol}>?</span>
          </div>
          <div className={styles.modeContent}>
            <h2 className={styles.modeTitle}>{t('game.modeSelection.classic.title')}</h2>
            <p className={styles.modeDescription}>{t('game.modeSelection.classic.description')}</p>
          </div>
        </button>

        <button
          className={styles.modeOption}
          onClick={() => handleModeSelect(GameMode.FunFact)}
          onKeyDown={(e) => handleKeyDown(e, GameMode.FunFact)}
          aria-label={t('game.modeSelection.funfact.ariaLabel')}
        >
          <div className={styles.modeIcon}>
            <span className={styles.iconSymbol}>💡</span>
          </div>
          <div className={styles.modeContent}>
            <h2 className={styles.modeTitle}>{t('game.modeSelection.funfact.title')}</h2>
            <p className={styles.modeDescription}>{t('game.modeSelection.funfact.description')}</p>
          </div>
        </button>
      </div>
    </div>
  );
};


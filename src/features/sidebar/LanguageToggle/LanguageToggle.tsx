import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setLanguage, selectLanguage, type Language } from '@/features/i18n';
import styles from './LanguageToggle.module.scss';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);

  const handleToggle = () => {
    const newLanguage: Language = currentLanguage === 'en' ? 'nb' : 'en';
    dispatch(setLanguage(newLanguage));
    i18n.changeLanguage(newLanguage);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      className={styles.toggle}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${currentLanguage === 'en' ? 'Norwegian' : 'English'}`}
      title={`Switch to ${currentLanguage === 'en' ? 'Norwegian' : 'English'}`}
    >
      {currentLanguage === 'en' ? '🇬🇧' : '🇳🇴'}
      <span className={styles.languageCode}>{currentLanguage.toUpperCase()}</span>
    </button>
  );
};


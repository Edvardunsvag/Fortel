import { useTranslation } from 'react-i18next';
import { ColorLegend } from '../Game/ColorLegend';
import styles from './RulesPage.module.scss';

export const RulesPage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('rules.title')}</h1>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('rules.howToPlay')}</h2>
            <p className={styles.text}>
              {t('rules.howToPlayDescription')}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('rules.hints')}</h2>
            <p className={styles.text}>
              {t('rules.hintsDescription')}
            </p>
            <ul className={styles.list}>
              <li><strong>{t('rules.department')}:</strong> {t('rules.departmentDescription')}</li>
              <li><strong>{t('rules.office')}:</strong> {t('rules.officeDescription')}</li>
              <li><strong>{t('rules.teams')}:</strong> {t('rules.teamsDescription')}</li>
              <li><strong>{t('rules.age')}:</strong> {t('rules.ageDescription')}</li>
              <li><strong>{t('rules.supervisor')}:</strong> {t('rules.supervisorDescription')}</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('rules.buyInterests')}</h2>
            <p className={styles.text}>
              {t('rules.buyInterestsDescription')}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('rules.colorLegend')}</h2>
            <ColorLegend />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('rules.winning')}</h2>
            <p className={styles.text}>
              {t('rules.winningDescription')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};


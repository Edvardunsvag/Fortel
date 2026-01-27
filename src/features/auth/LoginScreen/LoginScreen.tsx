import { useTranslation } from "react-i18next";
import { useMsalAuth } from "@/features/auth/useMsalAuth";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import styles from "./LoginScreen.module.scss";
import { LanguageToggle } from "@/features/sidebar/LanguageToggle/LanguageToggle";

export const LoginScreen = () => {
  const { t } = useTranslation();
  const { handleLogin, isLoading } = useMsalAuth();

  const handleClick = () => {
    handleLogin();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.languageToggleContainer}>
        <LanguageToggle />
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{t("loginScreen.title")}</h1>
        <p className={styles.subtitle}>{t("loginScreen.subtitle")}</p>
        <button
          className={styles.loginButton}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label={t("auth.login")}
        >
          {isLoading ? (
            <span className={styles.buttonContent}>
              <LoadingSpinner size="small" />
              {t("auth.loggingIn")}
            </span>
          ) : (
            t("auth.login")
          )}
        </button>
      </div>
    </div>
  );
};

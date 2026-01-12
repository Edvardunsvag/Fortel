import { useTranslation } from "react-i18next";
import { useMsalAuth } from "@/features/auth/useMsalAuth";
import { useAppSelector } from "@/app/hooks";
import { selectIsAuthenticated, selectAccount } from "@/features/auth/authSlice";
import styles from "./LoginButton.module.scss";

export const LoginButton = () => {
  const { t } = useTranslation();
  const { handleLogin, handleLogout, isLoading } = useMsalAuth();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const account = useAppSelector(selectAccount);

  const handleClick = () => {
    if (isAuthenticated) {
      handleLogout();
    } else {
      handleLogin();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  if (isAuthenticated && account) {
    return (
      <div className={styles.loginContainer}>
        <button
          className={styles.loginButton}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label={t("auth.logout")}
        >
          {isLoading ? t("auth.loggingOut") : t("auth.logout")}
        </button>
      </div>
    );
  }

  return (
    <button
      className={styles.loginButton}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      aria-label={t("auth.login")}
    >
      {isLoading ? t("auth.loggingIn") : t("auth.login")}
    </button>
  );
};

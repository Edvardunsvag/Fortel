import styles from "./LoadingSpinner.module.scss";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ size = "medium", message, fullScreen = false }: LoadingSpinnerProps) => {
  const sizeClass = styles[size];
  const containerClass = fullScreen ? styles.fullScreen : styles.container;

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${sizeClass}`} aria-label="Loading" role="status">
        <span className={styles.srOnly}>Loading...</span>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

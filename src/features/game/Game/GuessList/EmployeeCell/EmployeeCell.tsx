import type { Guess } from "@/features/game/types";
import styles from "./EmployeeCell.module.scss";

interface EmployeeCellProps {
  guess: Guess;
}

export const EmployeeCell = ({ guess }: EmployeeCellProps) => {
  // Show placeholder if no avatar URL or if URL contains "imagekit"
  const shouldShowPlaceholder = !guess.avatarImageUrl || guess.avatarImageUrl.toLowerCase().includes("imagekit");

  return (
    <td className={styles.employeeCell}>
      <div className={styles.employeeName}>
        {shouldShowPlaceholder ? (
          <div className={styles.avatarPlaceholder}>{guess.employeeName}</div>
        ) : (
          <img src={guess.avatarImageUrl} alt={guess.employeeName} className={styles.avatarImage} />
        )}
      </div>
    </td>
  );
};

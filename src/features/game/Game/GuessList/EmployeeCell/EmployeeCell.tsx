import type { Guess } from "@/features/game/types";
import styles from "./EmployeeCell.module.scss";

interface EmployeeCellProps {
  guess: Guess;
}

export const EmployeeCell = ({ guess }: EmployeeCellProps) => (
  <td className={styles.employeeCell}>
    <div className={styles.employeeName}>
      {guess.avatarImageUrl ? (
        <img src={guess.avatarImageUrl} alt={guess.employeeName} className={styles.avatarImage} />
      ) : (
        <div className={styles.avatarPlaceholder}>{guess.employeeName}</div>
      )}
    </div>
  </td>
);

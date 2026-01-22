import { useTranslation } from "react-i18next";
import type { WheelParticipant } from "../../api";
import styles from "./ParticipantsList.module.scss";

interface ParticipantsListProps {
  participants: WheelParticipant[];
  totalTickets: number;
}

export const ParticipantsList = ({ participants, totalTickets }: ParticipantsListProps) => {
  const { t } = useTranslation();

  if (participants.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>
          {t("lottery.luckyWheel.participants.title", "Participants")}
        </h3>
        <p className={styles.empty}>
          {t("lottery.luckyWheel.participants.empty", "No participants yet")}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {t("lottery.luckyWheel.participants.title", "Participants")}
      </h3>
      <p className={styles.subtitle}>
        {t("lottery.luckyWheel.participants.totalTickets", {
          count: totalTickets,
          defaultValue: "{{count}} tickets in the wheel",
        })}
      </p>

      <div className={styles.list}>
        {participants.map((participant) => {
          if (!participant.userId) return null;
          const color = participant.color ?? "#cccccc";
          const name = participant.name ?? "Unknown";
          return (
            <div key={participant.userId} className={styles.participant}>
              <div className={styles.info}>
                <div
                  className={styles.colorIndicator}
                  style={{ backgroundColor: color }}
                />
                {participant.image ? (
                  <img
                    src={participant.image}
                    alt={name}
                    className={styles.avatar}
                  />
                ) : (
                  <div
                    className={styles.avatarPlaceholder}
                    style={{ backgroundColor: color }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={styles.name}>{name}</span>
              </div>
              <div className={styles.ticketCount}>
                <span className={styles.count}>{participant.ticketCount ?? 0}</span>
                <span className={styles.label}>
                  {t("lottery.luckyWheel.participants.tickets", "tickets")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { useTranslation } from "react-i18next";
import styles from "./LeaderboardPage.module.scss";
import { useLeaderboard } from "../queries";

export const LeaderboardPage = () => {
  const { t } = useTranslation();
  const { data: leaderboard, isLoading, isError, error, refetch } = useLeaderboard();

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const language = localStorage.getItem("fortedle_language") || "en";
    const locale = language === "nb" ? "nb-NO" : "en-US";
    return date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <p className={styles.subtitle}>{t("leaderboard.loading")}</p>;
  }

  if (isError) {
    return (
      <>
        <p className={styles.subtitle} style={{ color: "var(--color-error)" }}>
          {error instanceof Error ? error.message : t("leaderboard.failedToLoad")}
        </p>
        <button
          onClick={handleRefresh}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-link-blue)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          {t("leaderboard.retry")}
        </button>
      </>
    );
  }

  const today = leaderboard?.date
    ? formatDate(leaderboard.date).charAt(0).toUpperCase() + formatDate(leaderboard.date).slice(1)
    : t("leaderboard.title");

  return (
    <>
      <p className={styles.subtitle}>{today}</p>

        {leaderboard && leaderboard.leaderboard.length > 0 ? (
          <div className={styles.content}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "2rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid var(--color-border-light)",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      fontWeight: 600,
                      color: "var(--color-dark-fill)",
                    }}
                  >
                    {t("leaderboard.rank")}
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      fontWeight: 600,
                      color: "var(--color-dark-fill)",
                    }}
                  >
                    {t("leaderboard.name")}
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      width: "80px",
                    }}
                  >
                    {/* Avatar column - no header text */}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "1rem",
                      fontWeight: 600,
                      color: "var(--color-dark-fill)",
                    }}
                  >
                    {t("leaderboard.score")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.leaderboard.map((entry) => (
                  <tr
                    key={`${entry.name}-${entry.rank}`}
                    style={{
                      borderBottom: "1px solid var(--color-border-light)",
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--color-dark-fill)",
                      }}
                    >
                      {entry.rank === 1 && "🥇"}
                      {entry.rank === 2 && "🥈"}
                      {entry.rank === 3 && "🥉"}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--color-dark-fill)",
                        fontWeight: entry.rank <= 3 ? 600 : 400,
                      }}
                    >
                      {entry.name}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                      }}
                    >
                      {(() => {
                        // Extract initials from name (first letter of first name and first letter of last name)
                        const getInitials = (name: string): string => {
                          const parts = name.trim().split(/\s+/);
                          if (parts.length === 0) return "";
                          if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
                          return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
                        };

                        // Show placeholder if no avatar URL or if URL contains "imagekit"
                        const shouldShowPlaceholder =
                          !entry.avatarImageUrl ||
                          (entry.avatarImageUrl && entry.avatarImageUrl.toLowerCase().includes("imagekit"));

                        if (shouldShowPlaceholder) {
                          return (
                            <div
                              className={styles.avatarPlaceholder}
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-dark-fill)",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                              }}
                            >
                              {getInitials(entry.name)}
                            </div>
                          );
                        }

                        return (
                          <img
                            src={entry.avatarImageUrl || ""}
                            alt={`${entry.name} avatar`}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        );
                      })()}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        color: "var(--color-dark-fill)",
                        fontWeight: entry.rank <= 3 ? 600 : 400,
                      }}
                    >
                      {entry.score} {entry.score === 1 ? t("game.guess") : t("game.guesses_plural")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.content}>
            <p className={styles.text}>{t("leaderboard.noScores")}</p>
          </div>
        )}
    </>
  );
};

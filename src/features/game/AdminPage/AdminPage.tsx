import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { selectAccount } from "@/features/auth/authSlice";
import { isAdminAccount } from "@/shared/config/adminConfig";
import { useEmployees, useSyncEmployees } from "@/features/game/employees";
import { getDateSeed, getTodayDateString, selectIndexBySeed } from "@/shared/utils/dateUtils";
import { hashEmployeeId } from "@/shared/utils/hashUtils";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { routes } from "@/shared/routes";
import { GameNavigationChips } from "@/features/game/Game/GameNavigationChips";
import { toSyncRequest } from "@/features/game/employees/toDto";
import styles from "./AdminPage.module.scss";

export const AdminPage = () => {
  const { t } = useTranslation();
  const account = useAppSelector(selectAccount);
  const isAdmin = isAdminAccount(account?.username);
  const { data: employees = [] } = useEmployees();
  const syncMutation = useSyncEmployees();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [alreadySynced, setAlreadySynced] = useState(false);
  const isSyncing = syncMutation.isPending;
  const hasEmployees = employees.length > 0;

  if (!isAdmin) {
    return <Navigate to={routes.play} replace />;
  }

  const today = getTodayDateString();
  const seed = getDateSeed(today);
  const index = selectIndexBySeed(seed, employees.length);
  const selectedEmployee = employees[index];

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSyncSuccess(false);
    setAlreadySynced(false);

    if (!tokenInput.trim()) {
      setError(t("sync.pleaseEnterToken"));
      return;
    }

    const accessToken = tokenInput.trim();

    try {
      const request = toSyncRequest(accessToken);
      const result = await syncMutation.mutateAsync(request);

      if (result.alreadySynced) {
        setAlreadySynced(true);
      } else {
        setSyncSuccess(true);
      }
      setTokenInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sync.failedToSync"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const obfuscatedId = selectedEmployee ? hashEmployeeId(selectedEmployee.id) : null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <GameNavigationChips />
        <h1 className={styles.title}>{t("admin.title")}</h1>
        <div className={styles.content}>
          {/* Today's Winner Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("admin.todaysWinner")}</h2>
            {!selectedEmployee ? (
              <p className={styles.message}>{t("admin.noEmployees")}</p>
            ) : (
              <div className={styles.winnerCard}>
                {selectedEmployee.avatarImageUrl && (
                  <img
                    src={selectedEmployee.avatarImageUrl}
                    alt={selectedEmployee.name}
                    className={styles.avatar}
                  />
                )}
                <p className={styles.winnerName}>{selectedEmployee.name}</p>
                <div className={styles.idSection}>
                  <div className={styles.idRow}>
                    <span className={styles.idLabel}>{t("admin.originalId")}:</span>
                    <code className={styles.idValue}>{selectedEmployee.id}</code>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => navigator.clipboard.writeText(selectedEmployee.id)}
                      aria-label={t("admin.copyId")}
                    >
                      📋
                    </button>
                  </div>
                  <div className={styles.idRow}>
                    <span className={styles.idLabel}>{t("admin.obfuscatedId")}:</span>
                    <code className={styles.idValue}>{obfuscatedId}</code>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => navigator.clipboard.writeText(obfuscatedId || "")}
                      aria-label={t("admin.copyId")}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className={styles.infoSection}>
                  <p className={styles.infoText}>
                    <strong>{t("admin.date")}:</strong> {today}
                  </p>
                  <p className={styles.infoText}>
                    <strong>{t("admin.department")}:</strong> {selectedEmployee.department}
                  </p>
                  <p className={styles.infoText}>
                    <strong>{t("admin.office")}:</strong> {selectedEmployee.office}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sync Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("sync.title")}</h2>
            <p className={styles.subtitle}>{t("sync.subtitle")}</p>

            {hasEmployees ? (
              <div className={styles.syncForm}>
                <p className={styles.success}>{t("sync.alreadySynced")}</p>
              </div>
            ) : (
              <form onSubmit={handleSync} className={styles.syncForm}>
                <label htmlFor="token-input" className={styles.tokenLabel}>
                  {t("sync.accessToken")}
                </label>
                <textarea
                  id="token-input"
                  className={styles.tokenInput}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("sync.tokenPlaceholder")}
                  rows={4}
                  disabled={isSyncing}
                />
                {error && <p className={styles.error}>{error}</p>}
                {alreadySynced && <p className={styles.success}>{t("sync.alreadySynced")}</p>}
                {syncSuccess && (
                  <p className={styles.success}>
                    {t("sync.dataSynced")} {t("sync.employeesLoaded")}
                  </p>
                )}
                <div className={styles.tokenActions}>
                  <button className={styles.submitButton} type="submit" disabled={isSyncing || !tokenInput.trim()}>
                    {isSyncing ? t("sync.syncing") : t("sync.syncData")}
                  </button>
                </div>
                <p className={styles.instructions}>
                  <strong>{t("sync.howToGetToken")}</strong>
                  <br />
                  {t("sync.step1")}
                  <br />
                  {t("sync.step2")}
                  <br />
                  {t("sync.step3")}
                  <br />
                  {t("sync.step4")}
                  <br />
                  {t("sync.step5")}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

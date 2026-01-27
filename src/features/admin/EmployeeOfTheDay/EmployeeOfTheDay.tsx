import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useEmployees, useSyncEmployees } from "@/features/game/employees";
import { toSyncRequest } from "@/features/game/employees/toDto";
import { getDateSeed, getTodayDateString, selectIndexBySeed } from "@/shared/utils/dateUtils";
import { hashEmployeeId } from "@/shared/utils/hashUtils";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import styles from "./EmployeeOfTheDay.module.scss";

export const EmployeeOfTheDay = () => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployees();
  const syncMutation = useSyncEmployees();
  const [tokenInput, setTokenInput] = useState("");
  const isSyncing = syncMutation.isPending;
  const hasEmployees = employees.length > 0;

  const today = getTodayDateString();
  const seed = getDateSeed(today);
  const index = selectIndexBySeed(seed, employees.length);
  const selectedEmployee = employees[index];
  const obfuscatedId = selectedEmployee ? hashEmployeeId(selectedEmployee.id) : null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenInput.trim()) {
      toast.error(t("sync.pleaseEnterToken"));
      return;
    }

    const accessToken = tokenInput.trim();

    try {
      const request = toSyncRequest(accessToken);
      const result = await syncMutation.mutateAsync(request);

      if (result.alreadySynced) {
        toast.info(t("sync.alreadySynced"));
      } else {
        toast.success(`${t("sync.dataSynced")} ${t("sync.employeesLoaded")}`);
      }
      setTokenInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sync.failedToSync"));
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

  return (
    <div className={styles.content}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("admin.todaysWinner")}</h2>
        <details className={styles.winnerDetails}>
          <summary className={styles.winnerSummary}>
            <p className={styles.winnerSubtitle}>{t("admin.toggleWinner")}</p>
          </summary>
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
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selectedEmployee.id);
                        toast.success(t("admin.idCopied") || "ID copied to clipboard");
                      } catch (err) {
                        toast.error(t("admin.copyFailed") || "Failed to copy ID");
                      }
                    }}
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
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(obfuscatedId || "");
                        toast.success(t("admin.idCopied") || "ID copied to clipboard");
                      } catch (err) {
                        toast.error(t("admin.copyFailed") || "Failed to copy ID");
                      }
                    }}
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
        </details>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("sync.title")}</h2>
        {hasEmployees && (
          <p className={styles.alreadySyncedMessage}>
            <span className={styles.checkmark}>✓</span> {t("sync.alreadySynced")}
          </p>
        )}
        <p className={styles.subtitle}>{t("sync.subtitle")}</p>

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
          <div className={styles.tokenActions}>
            <button className={styles.submitButton} type="submit" disabled={isSyncing || !tokenInput.trim()}>
              {isSyncing ? (
                <span className={styles.buttonContent}>
                  <LoadingSpinner size="small" />
                  {t("sync.syncing")}
                </span>
              ) : (
                t("sync.syncData")
              )}
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
      </div>
    </div>
  );
};

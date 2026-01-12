import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/app/hooks";
import { useSyncEmployees, useEmployees } from "@/features/employees/queries";
import { GameNavigationChips } from "@/features/game/Game/GameNavigationChips";
import styles from "./SyncPage.module.scss";
import { selectAccount } from "@/features/auth/authSlice";
import { ADMIN_ACCOUNT } from "@/shared/config/adminConfig";
import { toSyncRequest } from "@/features/employees/toDto";

export const SyncPage = () => {
  const { t } = useTranslation();
  const account = useAppSelector(selectAccount);
  const { data: employees = [] } = useEmployees();
  const syncMutation = useSyncEmployees();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [alreadySynced, setAlreadySynced] = useState(false);
  const isSyncing = syncMutation.isPending;
  const hasEmployees = employees.length > 0;

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

  const isAdmin = account?.username === ADMIN_ACCOUNT;

  return (
    <div className={styles.pageContent}>
      <div className={styles.container}>
        <GameNavigationChips />
        <h1 className={styles.title}>{t("sync.title")}</h1>
        <p className={styles.subtitle}>{t("sync.subtitle")}</p>

        {hasEmployees && !isAdmin ? (
          <div className={styles.tokenForm}>
            <p className={styles.success}>{t("sync.alreadySynced")}</p>
          </div>
        ) : (
          <form onSubmit={handleSync} className={styles.tokenForm}>
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
  );
};

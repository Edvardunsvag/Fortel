import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useGiftcardTransactions, useSendGiftcard } from "../queries";
import type { GiftcardTransaction } from "../queries";
import { useEmployees } from "@/features/game/employees";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
import styles from "./GiftcardAdmin.module.scss";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("nb-NO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (amount: number | undefined, currency: string | null | undefined): string => {
  if (amount === undefined) return "-";
  return `${amount} ${currency || "NOK"}`;
};

const getStatusClass = (status: string | null | undefined): string => {
  switch (status) {
    case "sent":
      return styles.statusSent;
    case "failed":
      return styles.statusFailed;
    case "pending":
    default:
      return styles.statusPending;
  }
};

const getReasonLabel = (reason: string | null | undefined, t: (key: string) => string): string => {
  if (!reason) return "-";
  const reasonKey = `giftcards.reasons.${reason}`;
  const translated = t(reasonKey);
  return translated !== reasonKey ? translated : reason;
};

export const GiftcardAdmin = () => {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading, error } = useGiftcardTransactions();
  const { data: employees = [] } = useEmployees();
  const sendGiftcard = useSendGiftcard();

  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState(500);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error(t("giftcards.errors.selectEmployee"));
      return;
    }

    if (amount <= 0 || amount > 10000) {
      toast.error(t("giftcards.errors.invalidAmount"));
      return;
    }

    try {
      const result = await sendGiftcard.mutateAsync({
        userId: selectedUserId,
        amount,
        message: message || undefined,
        reason: "manual",
      });

      if (result.success) {
        toast.success(t("giftcards.success.sent") || "Giftcard sent successfully");
        setShowForm(false);
        setSelectedUserId("");
        setAmount(500);
        setMessage("");
      } else {
        toast.error(result.errorMessage || t("giftcards.errors.sendFailed") || "Failed to send giftcard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("giftcards.errors.sendFailed") || "Failed to send giftcard");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("giftcards.title")}</h2>
        <LoadingSpinner message={t("giftcards.loading")} fullScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("giftcards.title")}</h2>
        <p className={styles.error}>{t("giftcards.error")}</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.sectionTitle}>{t("giftcards.title")}</h2>
          <p className={styles.subtitle}>{t("giftcards.subtitle")}</p>
        </div>
        <button
          type="button"
          className={styles.sendButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? t("giftcards.cancel") : t("giftcards.sendGiftcard")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="employee-select" className={styles.label}>
              {t("giftcards.form.selectEmployee")}
            </label>
            <select
              id="employee-select"
              className={styles.select}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">{t("giftcards.form.selectEmployee")}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="amount-input" className={styles.label}>
              {t("giftcards.form.amount")}
            </label>
            <input
              id="amount-input"
              type="number"
              className={styles.input}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              max={10000}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message-input" className={styles.label}>
              {t("giftcards.form.message")}
            </label>
            <textarea
              id="message-input"
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={sendGiftcard.isPending}
          >
            {sendGiftcard.isPending ? (
              <span className={styles.buttonContent}>
                <LoadingSpinner size="small" />
                {t("giftcards.sending")}
              </span>
            ) : (
              t("giftcards.form.submit")
            )}
          </button>
        </form>
      )}

      {transactions.length === 0 ? (
        <p className={styles.noTransactions}>{t("giftcards.noTransactions")}</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("giftcards.table.recipient")}</th>
                <th>{t("giftcards.table.amount")}</th>
                <th>{t("giftcards.table.status")}</th>
                <th>{t("giftcards.table.reason")}</th>
                <th>{t("giftcards.table.date")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: GiftcardTransaction) => (
                <tr key={tx.id}>
                  <td>
                    <div className={styles.recipient}>
                      <span className={styles.recipientName}>{tx.employeeName}</span>
                      <span className={styles.recipientEmail}>{tx.employeeEmail}</span>
                    </div>
                  </td>
                  <td>{formatAmount(tx.amount, tx.currency)}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(tx.status)}`}>
                      {t(`giftcards.status.${tx.status || "pending"}`)}
                    </span>
                  </td>
                  <td>{getReasonLabel(tx.reason, t)}</td>
                  <td>{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

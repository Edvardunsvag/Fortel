import { useTranslation } from "react-i18next";
import { Timeframe } from "../types";
import type { DateRange } from "../types";
import styles from "./TimeBankPage.module.scss";

interface TimeframeSelectorProps {
  selected: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  customRange?: DateRange;
  onCustomRangeChange?: (range: DateRange) => void;
}

export const TimeframeSelector = ({
  selected,
  onChange,
  customRange,
  onCustomRangeChange,
}: TimeframeSelectorProps) => {
  const { t } = useTranslation();

  const timeframes = [
    { value: Timeframe.YearToDate, label: t("timebank.yearToDate") },
    { value: Timeframe.ThisMonth, label: t("timebank.thisMonth") },
    { value: Timeframe.Rolling3Months, label: t("timebank.rolling3Months") },
    { value: Timeframe.Custom, label: t("timebank.custom") },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as Timeframe);
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomRangeChange && customRange) {
      onCustomRangeChange({ ...customRange, from: e.target.value });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomRangeChange && customRange) {
      onCustomRangeChange({ ...customRange, to: e.target.value });
    }
  };

  return (
    <div className={styles.timeframeSelector}>
      <select
        className={styles.timeframeDropdown}
        value={selected}
        onChange={handleChange}
        aria-label={t("timebank.selectTimeframe")}
      >
        {timeframes.map((tf) => (
          <option key={tf.value} value={tf.value}>
            {tf.label}
          </option>
        ))}
      </select>

      {selected === Timeframe.Custom && customRange && (
        <div className={styles.customDateRange}>
          <div className={styles.dateInputGroup}>
            <label className={styles.dateLabel}>{t("timebank.fromDate")}</label>
            <input
              type="date"
              className={styles.dateInput}
              value={customRange.from}
              onChange={handleFromChange}
            />
          </div>
          <div className={styles.dateInputGroup}>
            <label className={styles.dateLabel}>{t("timebank.toDate")}</label>
            <input
              type="date"
              className={styles.dateInput}
              value={customRange.to}
              onChange={handleToChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

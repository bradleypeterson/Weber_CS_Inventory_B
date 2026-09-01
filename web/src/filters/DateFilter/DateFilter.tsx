import { Calendar } from "@phosphor-icons/react";
import { ChangeEvent } from "react";
import { useFilters } from "../useFilters";
import styles from "./DateFilter.module.css";

/** Date filter as inclusive range: Date[0] = start, Date[1] = end (empty string = unset). */
export function DateFilter() {
  const { filters, selectedFilters, selectFilter } = useFilters();

  const start = selectedFilters["Date"]?.[0] ?? filters["Date"]?.[0] ?? "";
  const end = selectedFilters["Date"]?.[1] ?? filters["Date"]?.[1] ?? "";

  const handleStartChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    const newEnd = end;
    selectFilter("Date", !newStart && !newEnd ? [] : [newStart, newEnd]);
  };

  const handleEndChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStart = start;
    const newEnd = e.target.value;
    selectFilter("Date", !newStart && !newEnd ? [] : [newStart, newEnd]);
  };

  return (
    <div className={styles.filterContainer}>
      <p>Date range</p>
      <div className={styles.rangeStack}>
        <div className={styles.dateRow}>
          <label className={styles.dateLabel} htmlFor="date-filter-from">
            From
          </label>
          <div className={styles.inputContainer}>
            <input
              id="date-filter-from"
              type="date"
              value={start}
              onChange={handleStartChange}
              className={styles.dateInput}
              aria-label="From date"
            />
            <Calendar className={styles.calendarIcon} weight="light" />
          </div>
        </div>
        <div className={styles.dateRow}>
          <label className={styles.dateLabel} htmlFor="date-filter-to">
            To
          </label>
          <div className={styles.inputContainer}>
            <input
              id="date-filter-to"
              type="date"
              value={end}
              onChange={handleEndChange}
              className={styles.dateInput}
              aria-label="To date"
            />
            <Calendar className={styles.calendarIcon} weight="light" />
          </div>
        </div>
      </div>
    </div>
  );
} 
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { fetchSystemNotes, type SystemNote } from "../../api/systemNotes";
import { type Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { downloadExport, type ExportColumn } from "../../export/downloadExport";
import { useFilters } from "../../filters/useFilters";
import styles from "./SystemNotesDashboard.module.css";

const PAGE_SIZE_OPTIONS: Array<10 | 25 | 50 | 100> = [10, 25, 50, 100];
const NOTE_PREVIEW_LENGTH = 120;

const SYSTEM_NOTES_EXPORT_COLUMNS: ExportColumn<SystemNote>[] = [
  { label: "Entity Type", getValue: (row) => row.EntityType },
  { label: "Entity ID", getValue: (row) => String(row.EntityID) },
  { label: "Action", getValue: (row) => row.Action ?? "" },
  { label: "Performed By", getValue: (row) => row.PerformedByName },
  { label: "Performed By User ID", getValue: (row) => (row.PerformedBy != null ? String(row.PerformedBy) : "") },
  { label: "Performed At", getValue: (row) => row.PerformedAt },
  { label: "Note", getValue: (row) => row.Note }
];

export function SystemNotesDashboard() {
  const { filters } = useFilters();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50 | 100>(10);
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const entityTypes = filters["Entity Type"] ?? [];
  const startDate = filters.Date?.[0];
  const endDate = filters.Date?.[1];
  const performedBy = filters["Performed By"]?.[0];
  const entityTypeFilters = entityTypes
    .filter((entityType): entityType is string => typeof entityType === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const entityTypeFilterKey = entityTypeFilters.join("|");

  useEffect(() => {
    setPage(1);
    setExpandedNotes({});
  }, [entityTypeFilterKey, startDate, endDate, performedBy]);

  const { data, isLoading, error } = useQuery(
    ["systemNotes", entityTypeFilters, startDate, endDate, performedBy, page, pageSize],
    () =>
      fetchSystemNotes({
        entityTypes: entityTypeFilters.length > 0 ? entityTypeFilters : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        performedBy
      }, { page, pageSize }),
    {
      keepPreviousData: true
    }
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleExport = async () => {
    const allRows = await fetchSystemNotes(
      {
        entityTypes: entityTypeFilters.length > 0 ? entityTypeFilters : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        performedBy
      },
      { all: true }
    );
    if (!allRows || allRows.rows.length === 0) return;
    downloadExport({
      data: allRows.rows,
      columns: SYSTEM_NOTES_EXPORT_COLUMNS,
      format: "csv",
      filenameBase: "system-notes-export"
    });
  };

  const columns: Column<SystemNote>[] = useMemo(
    () => [
      { label: "Entity Type", dataIndex: "EntityType", align: "left" },
      { label: "Entity ID", dataIndex: "EntityID", align: "left" },
      { label: "Action", render: (row) => row.Action ?? "", align: "left" },
      { label: "Performed By", dataIndex: "PerformedByName", align: "left" },
      {
        label: "Performed By User ID",
        render: (row) => (row.PerformedBy != null ? row.PerformedBy : "unknown"),
        align: "left"
      },
      { label: "Performed At", dataIndex: "PerformedAt", align: "left" },
      {
        label: "Note",
        align: "left",
        render: (row) => {
          const expanded = expandedNotes[row.SystemNoteID] ?? false;
          const long = row.Note.length > NOTE_PREVIEW_LENGTH;
          const noteText = expanded || !long ? row.Note : `${row.Note.slice(0, NOTE_PREVIEW_LENGTH)}...`;
          if (!long) return noteText;
          return (
            <span>
              {noteText}{" "}
              <button
                type="button"
                className={styles.noteExpand}
                onClick={() =>
                  setExpandedNotes((prev) => ({ ...prev, [row.SystemNoteID]: !prev[row.SystemNoteID] }))
                }
              >
                {expanded ? "show less" : "..."}
              </button>
            </span>
          );
        }
      }
    ],
    [expandedNotes]
  );

  return (
    <main className={styles.layout}>
      <div className={styles.header}>
        <h2>System Notes Report</h2>
        <button
          type="button"
          className={styles.exportButton}
          onClick={handleExport}
          disabled={rows.length === 0 || isLoading}
        >
          Export CSV
        </button>
      </div>

      {isLoading && <div>Loading system notes...</div>}
      {Boolean(error) && <div className={styles.error}>Error loading system notes.</div>}
      {!isLoading && !error && rows.length === 0 && (
        <div className={styles.empty}>No results found.</div>
      )}

      {!isLoading && !error && rows.length > 0 && (
        <>
          <DynamicTable columns={columns} data={rows} />
          <div className={styles.paginationRow}>
            <div className={styles.pageSizeWrap}>
              <label htmlFor="system-notes-page-size">Rows:</label>
              <select
                id="system-notes-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value) as 10 | 25 | 50 | 100);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.pageNav}>
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                {"<"}
              </button>
              <span>
                Page {page} of {totalPages} ({total} results)
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {">"}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default SystemNotesDashboard;
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { fetchSystemNotes, type SystemNote } from "../../api/systemNotes";
import { type Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import styles from "./HistoryChangesSection.module.css";

const PAGE_SIZE_OPTIONS: Array<10 | 25 | 50 | 100> = [10, 25, 50, 100];
const NOTE_PREVIEW_LENGTH = 120;

export type HistoryChangesSectionProps = {
  /**
   * React Query key prefix. After a mutation, refresh with:
   * `queryClient.invalidateQueries({ queryKey: [queryScope, entityId] })`
   */
  queryScope: string;
  entityId: number;
  entityTypes: string[];
  emptyMessage: string;
  heading?: string;
};

/**
 * Paged system-note history (same columns as the asset details block, no entity type/id columns).
 */
export function HistoryChangesSection({
  queryScope,
  entityId,
  entityTypes,
  emptyMessage,
  heading = "History Changes"
}: HistoryChangesSectionProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50 | 100>(10);
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  const entityTypesKey = useMemo(() => [...entityTypes].sort().join("|"), [entityTypes]);
  const filters = useMemo(
    () => ({ entityTypes, entityId }),
    [entityTypes, entityId]
  );

  useEffect(() => {
    setPage(1);
    setExpandedNotes({});
  }, [entityId, queryScope, entityTypesKey]);

  const enabled = Number.isInteger(entityId) && entityId > 0;

  const { data, isLoading, error } = useQuery(
    [queryScope, entityId, entityTypesKey, page, pageSize],
    () => fetchSystemNotes(filters, { page, pageSize }),
    { keepPreviousData: true, enabled }
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<SystemNote>[] = useMemo(
    () => [
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
                  setExpandedNotes((prev) => ({
                    ...prev,
                    [row.SystemNoteID]: !prev[row.SystemNoteID]
                  }))
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

  const headingId = `${queryScope}-history-heading-${entityId}`;
  const pageSizeId = `${queryScope}-history-page-size-${entityId}`;

  if (!enabled) return null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h3 id={headingId}>{heading}</h3>
      {isLoading && <div className={styles.status}>Loading history...</div>}
      {Boolean(error) && <div className={styles.error}>Unable to load history.</div>}
      {!isLoading && !error && rows.length === 0 && (
        <div className={styles.empty}>{emptyMessage}</div>
      )}
      {!isLoading && !error && rows.length > 0 && (
        <>
          <DynamicTable columns={columns} data={rows} />
          <div className={styles.paginationRow}>
            <div className={styles.pageSizeWrap}>
              <label htmlFor={pageSizeId}>Rows:</label>
              <select
                id={pageSizeId}
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
    </section>
  );
}

/** System note entity types for a Person row (User + Contact share PersonID as EntityID). */
export const PERSON_SYSTEM_NOTE_ENTITY_TYPES = ["User", "Contact"] as const;

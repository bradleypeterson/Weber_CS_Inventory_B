import { Briefcase, CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { JSONSchemaType } from "ajv";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { ajv } from "../../ajv";
import { get } from "../../api/helpers";
import { Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { downloadExport, type ExportColumn } from "../../export/downloadExport";
import { useFilters } from "../../filters/useFilters";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./AuditHistoryDashboard.module.css";

type Data = {
  auditId: number;
  date: string;
  buildingID: number;
  building: string;
  locationID: number;
  room: string;
  auditorPersonID: number;
  auditor: string;
  itemsMissing: boolean;
};

interface ApiResponse {
  status: string;
  data: Data[];
}

const auditHistorySchema: JSONSchemaType<Data[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      auditId: { type: "number" },
      date: { type: "string" },
      buildingID: { type: "number" },
      building: { type: "string" },
      locationID: { type: "number" },
      room: { type: "string" },
      auditorPersonID: { type: "number" },
      auditor: { type: "string" },
      itemsMissing: { type: "boolean" }
    },
    required: ["auditId", "date", "buildingID", "building", "locationID", "room", "auditorPersonID", "auditor", "itemsMissing"]
  }
};

const validateAuditHistory = ajv.compile(auditHistorySchema);

function BuildColumns(linkTo: ReturnType<typeof useLinkTo>) {
  const columns: Column<Data>[] = [
    {
      label: "",
      render: (record: Data) => (
        <IconButton
          onClick={() => linkTo("Details", ["Audits", "History"], `audit_id=${record.auditId}`)}
          icon={<Briefcase />}
          variant="secondary"
          style={{ color: "var(--secondary-background)" }}
        />
      )
    },
    {
      dataIndex: "date",
      label: "Date"
    },
    {
      dataIndex: "building",
      label: "Building"
    },
    {
      dataIndex: "room",
      label: "Room"
    },
    {
      dataIndex: "auditor",
      label: "Auditor"
    },
    {
      dataIndex: "itemsMissing",
      label: "Items Missing",
      render: (record: Data) => record.itemsMissing ? "Yes" : "No"
    }
  ];

  return columns;
}

const AUDIT_EXPORT_COLUMNS: ExportColumn<Data>[] = [
  { label: "Date", getValue: (row) => row.date },
  { label: "Building", getValue: (row) => row.building },
  { label: "Room", getValue: (row) => row.room },
  { label: "Auditor", getValue: (row) => row.auditor },
  { label: "Items Missing", getValue: (row) => (row.itemsMissing ? "Yes" : "No") }
];

export function AuditHistoryDashboard() {
  const linkTo = useLinkTo();
  const { permissions } = useAuth();
  const { filters } = useFilters();
  const [searchText, setSearchText] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { data: auditHistory, isLoading, error } = useQuery<ApiResponse>(
    "auditHistory",
    async () => {
      const response = await get("/audits/history", validateAuditHistory);
      if (response.status === "error") {
        throw new Error(response.error.message);
      }
      return response;
    }
  );

  const filteredData = useMemo(
    () => {
      if (!auditHistory?.data) return [];

      return auditHistory.data
        .filter((row) => {
          const startDate = filters.Date?.[0];
          const endDate = filters.Date?.[1];
          const noDateFilter = !startDate && !endDate;
          const dateMatch =
            noDateFilter ||
            ((!startDate || row.date >= startDate) && (!endDate || row.date <= endDate));

          const buildingMatch = !filters.Building?.length || filters.Building.includes(row.buildingID);
          const roomMatch = !filters.Room?.length || filters.Room.includes(row.locationID);
          const auditorMatch = !filters.Auditor?.length || filters.Auditor.includes(row.auditorPersonID);
          const statusMatch = !filters.Status?.length || filters.Status[0] === row.itemsMissing.toString();

          return dateMatch && buildingMatch && roomMatch && auditorMatch && statusMatch;
        })
        .filter((row) =>
          Object.values(row).some((value) =>
            value.toString().toLowerCase().includes(searchText)
          )
        );
    },
    [searchText, auditHistory, filters]
  );

  const handleExport = useCallback(
    async (format: "csv" | "pdf") => {
      setExportMenuOpen(false);
      await downloadExport({
        data: filteredData,
        columns: AUDIT_EXPORT_COLUMNS,
        format,
        filenameBase: "audit-history-export"
      });
    },
    [filteredData]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [exportMenuOpen]);

  if (!hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS)) {
    return (
      <main className={styles.layout}>
        <div className={styles.row}>
          <div style={{ color: "red" }}>You do not have permission to view audit history.</div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading audit history: {(error as Error).message}</div>;
  }

  return (
    <main className={styles.layout}>
      <div className={styles.header}>
        <h2>Audit History</h2>
      </div>
      <div className={styles.searchContainer}>
        <IconInput
          icon={<MagnifyingGlass />}
          width="200px"
          placeholder="search"
          value={searchText}
          onChange={(val) => setSearchText(val.toLowerCase())}
        />
        <div className={styles.exportWrap} ref={exportMenuRef}>
          <button
            type="button"
            className={styles.exportButton}
            onClick={() => setExportMenuOpen((open) => !open)}
            disabled={filteredData.length === 0}
            aria-expanded={exportMenuOpen}
            aria-haspopup="menu"
          >
            Export <CaretDown size={14} className={styles.exportCaret} />
          </button>
          {exportMenuOpen && (
            <div className={styles.exportMenu} role="menu">
              <button
                type="button"
                role="menuitem"
                className={styles.exportMenuItem}
                onClick={() => handleExport("csv")}
              >
                Export as CSV
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.exportMenuItem}
                onClick={() => handleExport("pdf")}
              >
                Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>
      <DynamicTable columns={BuildColumns(linkTo)} data={filteredData} width="100%" />
    </main>
  );
}

export default AuditHistoryDashboard;
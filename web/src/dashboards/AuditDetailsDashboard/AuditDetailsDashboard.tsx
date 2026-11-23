import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { fetchAuditDetails, fetchAuditNotes, updateAuditNotes, type ItemNote, type RawData } from "../../api/audit";
import { ItemNotes } from "../../components/ItemNotes/ItemNotes";
import { Button } from "../../elements/Button/Button";
import { Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { IconInput } from "../../elements/IconInput/IconInput";
import { Modal } from "../../elements/Modal/Modal";
import { LabelInput } from "../../elements/LabelInput/LabelInput";
import { downloadAuditDetailsExport, type ExportColumn } from "../../export/downloadExport";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./AuditDetailsDashboard.module.css";

type Data = {
  tag_number: string;
  department: string;
  asset_class: string;
  device_type: string;
  contact_person: string;
  status: string;
  audit_time: string;
  building: string;
  room: string;
  created_by: string;
};

function normalizeString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeAuditDetails(data: RawData[]): Data[] {
  return data.map((row) => ({
    tag_number: normalizeString(row.tag_number),
    department: normalizeString(row.department),
    asset_class: normalizeString(row.asset_class),
    device_type: normalizeString(row.device_type),
    contact_person: normalizeString(row.contact_person),
    status: normalizeString(row.status) || "Unknown",
    audit_time: normalizeString(row.audit_time),
    building: normalizeString(row.building),
    room: normalizeString(row.room),
    created_by: normalizeString(row.created_by)
  }));
}

const AUDIT_DETAILS_EXPORT_COLUMNS: ExportColumn<Data>[] = [
  { label: "Tag Number", getValue: (row) => row.tag_number },
  { label: "Department", getValue: (row) => row.department ?? "" },
  { label: "Asset Class", getValue: (row) => row.asset_class ?? "" },
  { label: "Device Type", getValue: (row) => row.device_type ?? "" },
  { label: "Contact Person", getValue: (row) => row.contact_person ?? "" },
  { label: "Status", getValue: (row) => row.status }
];

function applyNoteEdits(saved: ItemNote[], edits: ItemNote[]) {
  const byTag = new Map(saved.map(note => [note.tagNumber, note]));
  for (const edit of edits) byTag.set(edit.tagNumber, edit);
  return Array.from(byTag.values());
}

export function AuditDetailsDashboard() {
  const [searchParams] = useSearchParams();
  const auditId = searchParams.get("audit_id") ?? "";
  return <AuditDetails key={auditId} auditId={auditId} />;
}

function AuditDetails({ auditId }: { auditId: string }) {
  const { permissions } = useAuth();
  const linkTo = useLinkTo();
  const [searchText, setSearchText] = useState("");
  const [draftNotes, setDraftNotes] = useState<ItemNote[]>([]);
  const hasChanges = draftNotes.length > 0;
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: auditDetails, isLoading: isLoadingDetails, error: detailsError } = useQuery<Data[]>(
    ["auditDetails", auditId],
    async () => {
      if (!auditId) throw new Error("No audit ID provided");
      const data = await fetchAuditDetails(auditId);

      return normalizeAuditDetails(data);
    },
    {
      enabled: !!auditId
    }
  );

  const { data: savedNotes, isLoading: isLoadingNotes, error: notesError } = useQuery(
    ["auditNotes", auditId],
    () => fetchAuditNotes(auditId),
    { enabled: !!auditId }
  );

  const itemNotes = useMemo(() => applyNoteEdits(savedNotes ?? [], draftNotes), [savedNotes, draftNotes]);

  const saveNotes = useMutation({
    mutationFn: (edits: ItemNote[]) => updateAuditNotes(auditId, edits),
    onSuccess: async (_, submitted) => {
      const key = ["auditNotes", auditId];
      await queryClient.cancelQueries(key, { exact: true });
      queryClient.setQueryData<ItemNote[]>(key, saved => applyNoteEdits(saved ?? [], submitted));
      setDraftNotes([]);
    }
  });

  const filteredData = useMemo(
    () => 
      auditDetails?.filter((row) => 
        Object.values(row).some((value) => 
          value?.toString().toLowerCase().includes(searchText)
        )
      ) ?? [],
    [auditDetails, searchText]
  );

  // Convert equipment data for ItemNotes component
  const equipmentItems = useMemo(() => {
    if (!auditDetails) return [];
    
    return auditDetails.map(item => ({
      TagNumber: item.tag_number,
      Description: item.device_type || 'Unknown'
    }));
  }, [auditDetails]);

  const isLoading = isLoadingDetails || isLoadingNotes;
  const error = (!auditDetails && detailsError) || (!savedNotes && notesError);

  function handleNoteChange(tagNumber: string, note: string) {
    const saved = savedNotes?.find(item => item.tagNumber === tagNumber);
    setDraftNotes(current => {
      const others = current.filter(item => item.tagNumber !== tagNumber);
      return note === saved?.note ? others : [...others, { tagNumber, note }];
    });
  }

  function handleBack() {
    if (hasChanges) setConfirmDiscard(true);
    else linkTo("History", ["Audits"]);
  }

  const handleExport = useCallback(
    async (format: "csv" | "pdf") => {
      setExportMenuOpen(false);
      if (!auditId || !auditDetails?.length) return;
      const first = auditDetails[0];
      const summary = {
        date: first.audit_time ? new Date(first.audit_time).toLocaleDateString() : "",
        location: first ? `${first.building ?? ""} ${first.room ?? ""}`.trim() : "",
        auditor: first?.created_by ?? ""
      };
      await downloadAuditDetailsExport({
        summary,
        equipmentData: auditDetails,
        equipmentColumns: AUDIT_DETAILS_EXPORT_COLUMNS,
        notes: itemNotes,
        format,
        auditId
      });
    },
    [auditId, auditDetails, itemNotes]
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
          <div style={{ color: "red" }}>You do not have permission to view audit details.</div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={styles.layout}>
        <div>Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.layout}>
        <div style={{ color: "red" }}>Error loading audit details: {error instanceof Error ? error.message : "Unknown error"}</div>
      </main>
    );
  }

  return (
    <main className={styles.layout}>
      <div className={styles.header}>
        <div />
        <h2>Audit Details</h2>        
      </div>

      <div className={styles.auditInfoContainer}>
        <LabelInput
          label="Date"
          value={auditDetails?.[0]?.audit_time ? new Date(auditDetails[0].audit_time).toLocaleDateString() : ''}
          readOnly
          width="200px"
        />
        <LabelInput
          label="Location"
          value={auditDetails?.[0] ? `${auditDetails[0].building}${auditDetails[0].room}` : ''}
          readOnly
          width="200px"
        />
        <LabelInput
          label="Auditor"
          value={auditDetails?.[0]?.created_by || ''}
          readOnly
          width="200px"
        />
      </div>

      <div className={styles.controls}>
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
            disabled={!auditId || !auditDetails?.length}
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
      <DynamicTable columns={BuildColumns()} data={filteredData} width="100%" style={{ marginTop: "1rem" }} />
      
      {/* Replace Notes with ItemNotes component */}
      <ItemNotes 
        itemNotes={itemNotes} 
        equipmentItems={equipmentItems}
        editingDisabled={saveNotes.isLoading}
        onAdd={handleNoteChange}
      />
      
      <Modal isOpen={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="Discard unsaved audit notes?">
        <p>Returning to Audit History will discard your changes.</p>
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
          <Button variant="primary" onClick={() => linkTo("History", ["Audits"])}>Discard changes</Button>
        </div>
      </Modal>

      <div className={styles.backButtonContainer}>
        {saveNotes.isError && hasChanges && (
          <span role="alert">Could not save your notes. Your edits are here. Try saving again.</span>
        )}
        {hasChanges && (
          <Button 
            variant="primary"
            onClick={() => saveNotes.mutate(draftNotes)}
            className={styles.wideButton}
            disabled={saveNotes.isLoading}
          >
            {saveNotes.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
        <Button 
          variant="secondary"
          disabled={saveNotes.isLoading}
          onClick={handleBack}
          className={styles.wideButton}
        >
          Back
        </Button>
      </div>
    </main>
  );
}

function BuildColumns() {
  const columns: Column<Data>[] = [
    {
      dataIndex: "tag_number",
      label: "Tag Number"
    },
    {
      dataIndex: "department",
      label: "Department"
    },
    {
      dataIndex: "asset_class",
      label: "Asset Class"
    },
    {
      dataIndex: "device_type",
      label: "Device Type"
    },
    {
      dataIndex: "contact_person",
      label: "Contact Person"
    },
    {
      dataIndex: "status",
      label: "Status"
    }
  ];

  return columns;
}

export default AuditDetailsDashboard;

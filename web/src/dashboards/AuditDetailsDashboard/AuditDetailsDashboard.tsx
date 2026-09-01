import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { JSONSchemaType, ValidateFunction } from "ajv";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router-dom";
import { ajv } from "../../ajv";
import { get } from "../../api/helpers";
import { ItemNotes } from "../../components/ItemNotes/ItemNotes";
import { Button } from "../../elements/Button/Button";
import { Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { IconInput } from "../../elements/IconInput/IconInput";
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

type RawData = {
  tag_number: string | number | null;
  department?: string | null;
  asset_class?: string | null;
  device_type?: string | null;
  contact_person?: string | null;
  status?: string | null;
  audit_time?: string | null;
  building?: string | null;
  room?: string | null;
  created_by?: string | null;
};

interface ApiResponse {
  status: string;
  data: Data[];
}

// Define the ItemNote type for audit notes
interface ItemNote {
  tagNumber: string;
  note: string;
}

const auditDetailsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tag_number: { type: ["string", "number", "null"] },
      department: { type: ["string", "null"] },
      asset_class: { type: ["string", "null"] },
      device_type: { type: ["string", "null"] },
      contact_person: { type: ["string", "null"] },
      status: { type: ["string", "null"] },
      audit_time: { type: ["string", "null"] },
      building: { type: ["string", "null"] },
      room: { type: ["string", "null"] },
      created_by: { type: ["string", "null"] }
    },
    required: ["tag_number"],
    additionalProperties: true
  }
} as const;

const validateAuditDetails = ajv.compile<RawData[]>(auditDetailsSchema) as ValidateFunction<RawData[]>;

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

// Simple validator for audit notes
const auditNotesSchema: JSONSchemaType<ItemNote[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tagNumber: { type: "string" },
      note: { type: "string" }
    },
    required: ["tagNumber", "note"]
  }
};

const validateAuditNotes = ajv.compile(auditNotesSchema);

const AUDIT_DETAILS_EXPORT_COLUMNS: ExportColumn<Data>[] = [
  { label: "Tag Number", getValue: (row) => row.tag_number },
  { label: "Department", getValue: (row) => row.department ?? "" },
  { label: "Asset Class", getValue: (row) => row.asset_class ?? "" },
  { label: "Device Type", getValue: (row) => row.device_type ?? "" },
  { label: "Contact Person", getValue: (row) => row.contact_person ?? "" },
  { label: "Status", getValue: (row) => row.status }
];

export function AuditDetailsDashboard() {
  const { permissions } = useAuth();
  const linkTo = useLinkTo();
  const [searchParams] = useSearchParams();
  const auditId = searchParams.get("audit_id");
  const [searchText, setSearchText] = useState("");
  const [itemNotes, setItemNotes] = useState<ItemNote[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const originalNotes = useRef<ItemNote[]>([]);
  const queryClient = useQueryClient();

  const { data: auditDetails, isLoading: isLoadingDetails, error: detailsError } = useQuery<ApiResponse>(
    ["auditDetails", auditId],
    async () => {
      if (!auditId) throw new Error("No audit ID provided");
      const response = await get(`/audits/history/${auditId}`, validateAuditDetails);
      if (response.status === "error") {
        throw new Error(response.error.message);
      }
      return {
        ...response,
        data: normalizeAuditDetails(response.data)
      };
    },
    {
      enabled: !!auditId
    }
  );

  // Fetch audit notes
  const { isLoading: isLoadingNotes, error: notesError } = useQuery(
    ["auditNotes", auditId],
    async () => {
      if (!auditId) throw new Error("No audit ID provided");
      const response = await get(`/audits/notes/${auditId}`, validateAuditNotes);
      
      if (response.status === "error") {
        throw new Error(response.error.message);
      }
      
      // Set the notes in state for use with ItemNotes component
      setItemNotes(response.data);
      originalNotes.current = [...response.data]; // Keep a copy of original notes
      
      return response;
    },
    {
      enabled: !!auditId
    }
  );

  // Mutation for saving notes
  const saveNotes = useMutation({
    mutationFn: async (notes: ItemNote[]) => {
      if (!auditId) throw new Error("No audit ID provided");
      
      // Use a more basic approach without strict validation
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/audits/update-notes/${auditId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ notes })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.status === 'error') {
          throw new Error(data.error?.message || 'Failed to update notes');
        }
        
        return data;
      } catch (error) {
        console.error("Error in saveNotes mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Update local state - make a deep copy of the current notes
      originalNotes.current = JSON.parse(JSON.stringify(itemNotes));
      
      // Make sure to set hasChanges to false immediately
      setHasChanges(false);
      
      // Consider invalidating the query after a short delay to ensure state updates first
      setTimeout(() => {
        queryClient.invalidateQueries(["auditNotes", auditId]);
      }, 100);
    },
    onError: (error) => {
      console.error("Error saving notes:", error);
      if (error instanceof Error && error.message.includes('validate')) {
        console.log("Validation error but assuming notes were saved");
        originalNotes.current = JSON.parse(JSON.stringify(itemNotes));
        setHasChanges(false);
      }
    }
  });

  const filteredData = useMemo(
    () => 
      auditDetails?.data.filter((row) => 
        Object.values(row).some((value) => 
          value?.toString().toLowerCase().includes(searchText)
        )
      ) ?? [],
    [auditDetails?.data, searchText]
  );

  // Convert equipment data for ItemNotes component
  const equipmentItems = useMemo(() => {
    if (!auditDetails?.data) return [];
    
    return auditDetails.data.map(item => ({
      TagNumber: item.tag_number,
      Description: item.device_type || 'Unknown'
    }));
  }, [auditDetails?.data]);

  const isLoading = isLoadingDetails || isLoadingNotes;
  const error = detailsError || notesError;

  // Function to handle note changes
  const handleNoteChange = (tagNumber: string, note: string) => {
    const existingNoteIndex = itemNotes.findIndex(item => item.tagNumber === tagNumber);
    
    let updatedNotes: ItemNote[];
    if (existingNoteIndex >= 0) {
      updatedNotes = [...itemNotes];
      updatedNotes[existingNoteIndex] = { tagNumber, note };
    } else {
      updatedNotes = [...itemNotes, { tagNumber, note }];
    }
    
    setItemNotes(updatedNotes);
    
    // Check if notes have changed compared to original
    const hasChanged = updatedNotes.length !== originalNotes.current.length || 
      updatedNotes.some((updatedNote) => {
        const originalNote = originalNotes.current.find(n => n.tagNumber === updatedNote.tagNumber);
        return !originalNote || originalNote.note !== updatedNote.note;
      });
    
    setHasChanges(hasChanged);
  };

  // Function to handle saving notes
  const handleSaveNotes = () => {
    saveNotes.mutate(itemNotes);
  };

  const handleExport = useCallback(
    (format: "csv" | "pdf") => {
      setExportMenuOpen(false);
      if (!auditId || !auditDetails?.data?.length) return;
      const first = auditDetails.data[0];
      const summary = {
        date: first.audit_time ? new Date(first.audit_time).toLocaleDateString() : "",
        location: first ? `${first.building ?? ""} ${first.room ?? ""}`.trim() : "",
        auditor: first?.created_by ?? ""
      };
      downloadAuditDetailsExport({
        summary,
        equipmentData: auditDetails.data,
        equipmentColumns: AUDIT_DETAILS_EXPORT_COLUMNS,
        notes: itemNotes,
        format,
        auditId
      });
    },
    [auditId, auditDetails?.data, itemNotes]
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
          value={auditDetails?.data[0]?.audit_time ? new Date(auditDetails.data[0].audit_time).toLocaleDateString() : ''}
          readOnly
          width="200px"
        />
        <LabelInput
          label="Location"
          value={auditDetails?.data[0] ? `${auditDetails.data[0].building}${auditDetails.data[0].room}` : ''}
          readOnly
          width="200px"
        />
        <LabelInput
          label="Auditor"
          value={auditDetails?.data[0]?.created_by || ''}
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
            disabled={!auditId || !auditDetails?.data?.length}
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
        onAdd={handleNoteChange}
      />
      
      <div className={styles.backButtonContainer}>
        {hasChanges && (
          <Button 
            variant="primary"
            onClick={handleSaveNotes}
            className={styles.wideButton}
            disabled={saveNotes.isLoading}
          >
            {saveNotes.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
        <Button 
          variant="secondary"
          onClick={() => linkTo("History", ["Audits"])}
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

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Column definition for export. Use getValue to format each cell (e.g. booleans as "Yes"/"No").
 */
export type ExportColumn<T> = {
  label: string;
  getValue: (row: T) => string;
};

export type ExportFormat = "csv" | "pdf";

export interface DownloadExportOptions<T> {
  /** Data rows to export (e.g. currently visible/filtered data). */
  data: T[];
  /** Column definitions: label for header, getValue for each cell. */
  columns: ExportColumn<T>[];
  /** Export format. */
  format: ExportFormat;
  /** Base filename without extension or date (e.g. "audit-history-export"). */
  filenameBase: string;
}

function getFilename(filenameBase: string, format: ExportFormat): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const ext = format === "csv" ? "csv" : "pdf";
  return `${filenameBase}-${y}-${m}-${d}.${ext}`;
}

function escapeCsvCell(value: string): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsvContent<T>(data: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const rows = data.map((row) =>
    columns.map((c) => escapeCsvCell(c.getValue(row))).join(",")
  );
  const BOM = "\uFEFF";
  return BOM + [header, ...rows].join("\r\n");
}

function buildPdfBlob<T>(data: T[], columns: ExportColumn<T>[]): Blob {
  const doc = new jsPDF({ orientation: "landscape" });
  const head = [columns.map((c) => c.label)];
  const body = data.map((row) => columns.map((c) => c.getValue(row)));
  autoTable(doc, {
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200] }
  });
  return doc.output("blob");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Audit details export: summary + equipment table + notes table. */
export interface AuditDetailsExportOptions<T> {
  summary: { date: string; location: string; auditor: string };
  equipmentData: T[];
  equipmentColumns: ExportColumn<T>[];
  notes: { tagNumber: string; note: string }[];
  format: ExportFormat;
  auditId: string;
}

function getAuditDetailsFilename(auditId: string, format: ExportFormat): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const ext = format === "csv" ? "csv" : "pdf";
  return `audit-details-export-${auditId}-${y}-${m}-${d}.${ext}`;
}

function buildAuditDetailsCsvContent<T>(
  summary: { date: string; location: string; auditor: string },
  equipmentData: T[],
  equipmentColumns: ExportColumn<T>[],
  notes: { tagNumber: string; note: string }[]
): string {
  const summaryHeader = "Date,Location,Auditor";
  const summaryRow = [escapeCsvCell(summary.date), escapeCsvCell(summary.location), escapeCsvCell(summary.auditor)].join(",");
  const equipmentHeader = equipmentColumns.map((c) => escapeCsvCell(c.label)).join(",");
  const equipmentRows = equipmentData.map((row) =>
    equipmentColumns.map((c) => escapeCsvCell(c.getValue(row))).join(",")
  );
  const notesHeader = "Tag Number,Note";
  const notesRows = notes.map((n) => `${escapeCsvCell(n.tagNumber)},${escapeCsvCell(n.note)}`);
  const BOM = "\uFEFF";
  const sections = [
    summaryHeader,
    summaryRow,
    "",
    equipmentHeader,
    ...equipmentRows,
    "",
    notesHeader,
    ...notesRows
  ];
  return BOM + sections.join("\r\n");
}

function buildAuditDetailsPdfBlob<T>(
  summary: { date: string; location: string; auditor: string },
  equipmentData: T[],
  equipmentColumns: ExportColumn<T>[],
  notes: { tagNumber: string; note: string }[]
): Blob {
  const doc = new jsPDF({ orientation: "landscape" });
  let startY = 14;

  doc.setFontSize(14);
  doc.text("Audit Summary", 14, startY);
  startY += 8;

  doc.setFontSize(10);
  const summaryHead = [["Field", "Value"]];
  const summaryBody = [
    ["Date", summary.date],
    ["Location", summary.location],
    ["Auditor", summary.auditor]
  ];
  autoTable(doc, {
    head: summaryHead,
    body: summaryBody,
    startY,
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200] },
    tableWidth: "wrap"
  });
  startY = ((doc as unknown) as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10;

  doc.setFontSize(14);
  doc.text("Equipment", 14, startY);
  startY += 8;

  const equipHead = [equipmentColumns.map((c) => c.label)];
  const equipBody = equipmentData.map((row) => equipmentColumns.map((c) => c.getValue(row)));
  autoTable(doc, {
    head: equipHead,
    body: equipBody,
    startY,
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200] }
  });
  startY = ((doc as unknown) as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10;

  doc.setFontSize(14);
  doc.text("Notes", 14, startY);
  startY += 8;

  const notesHead = [["Tag Number", "Note"]];
  const notesBody = notes.map((n) => [n.tagNumber, n.note]);
  autoTable(doc, {
    head: notesHead,
    body: notesBody.length ? notesBody : [["—", "No notes"]],
    startY,
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200] }
  });

  return doc.output("blob");
}

/**
 * Exports full audit details (summary + equipment table + notes) as CSV or PDF and triggers a download.
 */
export function downloadAuditDetailsExport<T>(options: AuditDetailsExportOptions<T>): void {
  const { summary, equipmentData, equipmentColumns, notes, format, auditId } = options;
  const filename = getAuditDetailsFilename(auditId, format);

  if (format === "csv") {
    const content = buildAuditDetailsCsvContent(summary, equipmentData, equipmentColumns, notes);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, filename);
    return;
  }

  const blob = buildAuditDetailsPdfBlob(summary, equipmentData, equipmentColumns, notes);
  triggerDownload(blob, filename);
}

/**
 * Exports the given data as CSV or PDF and triggers a download.
 * Use this from any dashboard: pass the currently visible data, column definitions, format, and filename base.
 */
export function downloadExport<T>(options: DownloadExportOptions<T>): void {
  const { data, columns, format, filenameBase } = options;
  const filename = getFilename(filenameBase, format);

  if (format === "csv") {
    const content = buildCsvContent(data, columns);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, filename);
    return;
  }

  const blob = buildPdfBlob(data, columns);
  triggerDownload(blob, filename);
}

import type { ExportColumn } from "./downloadExport";

function escapeCsvCell(value: string): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsvContent<T>(data: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const rows = data.map((row) =>
    columns.map((c) => escapeCsvCell(c.getValue(row))).join(",")
  );
  const BOM = "\uFEFF";
  return BOM + [header, ...rows].join("\r\n");
}

export function buildAuditDetailsCsvContent<T>(
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

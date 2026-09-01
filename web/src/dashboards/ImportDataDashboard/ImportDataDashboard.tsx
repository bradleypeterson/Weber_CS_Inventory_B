import { ArrowRight, FolderSimple } from "@phosphor-icons/react";
import { ChangeEvent, MouseEvent, useMemo, useRef, useState } from "react";
import { importAssets, previewImport, type ImportPreviewResponse } from "../../api/imports";
import { Button } from "../../elements/Button/Button";
import { IconButton } from "../../elements/IconButton/IconButton";
import { downloadExport, type ExportColumn } from "../../export/downloadExport";
import styles from "./ImportDataDashboard.module.css";

type PreviewResult = ImportPreviewResponse;

type ImportOutcome = "idle" | "success" | "partial" | "failure";

type ImportFailureReasonSource = "validation" | "import";

type FailedRow = {
  rowNumber: number;
  values: Record<string, string>;
  issues: string[];
  reasonSources: ImportFailureReasonSource[];
};

type ImportResult = {
  outcome: ImportOutcome;
  successCount: number;
  failedCount: number;
  failedRows: FailedRow[];
  warnings: string[];
  message: string;
  failedDownloadFileName: string;
};

function buildFailedFileName(originalFileName: string) {
  if (originalFileName.trim() === "") return "failed-rows";
  const dotIndex = originalFileName.lastIndexOf(".");
  if (dotIndex <= 0) return `${originalFileName}-failed-rows`;
  const baseName = originalFileName.slice(0, dotIndex);
  return `${baseName}-failed-rows`;
}

function buildFailedRowsExportColumns(headers: string[]): ExportColumn<FailedRow>[] {
  const valueColumns = headers.map<ExportColumn<FailedRow>>((header) => ({
    label: header,
    getValue: (row) => row.values[header] ?? ""
  }));
  const issueColumn: ExportColumn<FailedRow> = {
    label: "ISSUES",
    getValue: (row) => row.issues.join(" | ")
  };

  return [...valueColumns, issueColumn];
}

function isDuplicateIssue(issue: string) {
  return issue.startsWith("Duplicate TAG NUMBER") || issue.startsWith("TAG NUMBER already exists");
}

export function ImportDataDashboard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileContents, setFileContents] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importableRows = useMemo(() => preview?.rows.filter((row) => row.valid) ?? [], [preview]);
  const validationFailedRows = useMemo(() => preview?.rows.filter((row) => !row.valid) ?? [], [preview]);
  const rowsToDisplay = useMemo(() => {
    if (importResult && (importResult.outcome === "partial" || importResult.outcome === "failure")) {
      return importResult.failedRows;
    }
    return preview?.rows ?? [];
  }, [preview, importResult]);
  const showImportAction = useMemo(
    () => preview !== null && (importResult === null || importResult.outcome === "idle"),
    [preview, importResult]
  );
  const canPreview = useMemo(
    () => fileName !== "" && !isPreviewing && preview === null && !isImporting,
    [fileName, isPreviewing, preview, isImporting]
  );
  const activeWarnings = importResult?.warnings ?? preview?.warnings ?? [];

  const warningRowCount = useMemo(
    () => preview?.rows.filter((row) => row.valid && row.warnings.length > 0).length ?? 0,
    [preview]
  );

  const duplicateRowCount = useMemo(
    () =>
      preview?.rows.filter(
        (row) => row.issues.length > 0 && row.issues.every(isDuplicateIssue)
      ).length ?? 0,
    [preview]
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setImportResult(null);
    setPreview(null);

    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setFileContents("");
      return;
    }

    setFileName(file.name);
    const contents = await file.text();
    setFileContents(contents);
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  async function handlePreview() {
    setError("");
    setImportResult(null);

    if (!fileName.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file.");
      return;
    }

    if (!fileContents) {
      setError("Selected file is empty.");
      return;
    }

    setIsPreviewing(true);
    try {
      const response = await previewImport({ fileName, fileContents });
      if (response.status === "error") {
        setError(response.error.message || "Unable to preview file.");
        return;
      }

      setPreview(response.data);
      if (response.data.validCount === 0) {
        setImportResult({
          outcome: "failure",
          successCount: 0,
          failedCount: response.data.invalidCount,
          failedRows: response.data.rows
            .filter((row) => !row.valid)
            .map((row) => ({
              rowNumber: row.rowNumber,
              values: row.values,
              issues: row.issues,
              reasonSources: ["validation"]
            })),
          warnings: response.data.warnings,
          message: `Import failed: all ${response.data.invalidCount} rows have validation issues.`,
          failedDownloadFileName: buildFailedFileName(fileName)
        });
      } else {
        setImportResult({
          outcome: "idle",
          successCount: 0,
          failedCount: 0,
          failedRows: [],
          warnings: response.data.warnings,
          message: "",
          failedDownloadFileName: buildFailedFileName(fileName)
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to parse file.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    if (!preview || importableRows.length === 0 || isImporting) return;

    setIsImporting(true);
    setError("");
    setImportResult(null);

    try {
      const apiResponse = await importAssets({
        fileName,
        rows: importableRows.map((row) => ({
          rowNumber: row.rowNumber,
          values: row.values
        }))
      });
      
      if (apiResponse.status === "error") {
        setError(apiResponse.error.message || "Import failed.");
        return;
      } 
      
      const result = apiResponse.data;

      const importFailedRows: FailedRow[] = result.failedRows.map((failedRow) => {
        const row = importableRows.find((candidate) => candidate.rowNumber === failedRow.rowNumber);
        return {
          rowNumber: failedRow.rowNumber,
          values: failedRow.values ?? row?.values ?? {},
          issues: failedRow.issues,
          reasonSources: ["import"]
        };
      });

      const normalizedValidationFailedRows: FailedRow[] = validationFailedRows.map((row) => ({
        rowNumber: row.rowNumber,
        values: row.values,
        issues: row.issues,
        reasonSources: ["validation"]
      }));

      const combinedFailedRows = [...normalizedValidationFailedRows, ...importFailedRows];
      const successCount = result.successCount;
      const failedCount = combinedFailedRows.length;

      if (failedCount === 0) {
        setPreview(null);
        setImportResult({
          outcome: "success",
          successCount,
          failedCount: 0,
          failedRows: [],
          warnings: result.warnings,
          message: `Successfully imported ${successCount} assets.`,
          failedDownloadFileName: buildFailedFileName(fileName)
        });
      } else if (successCount === 0) {
        setImportResult({
          outcome: "failure",
          successCount,
          failedCount,
          failedRows: combinedFailedRows,
          warnings: result.warnings,
          message: `Import failed: 0 imported, ${failedCount} failed.`,
          failedDownloadFileName: buildFailedFileName(fileName)
        });
      } else {
        setImportResult({
          outcome: "partial",
          successCount,
          failedCount,
          failedRows: combinedFailedRows,
          warnings: result.warnings,
          message: `Partial success: ${successCount} imported, ${failedCount} failed.`,
          failedDownloadFileName: buildFailedFileName(fileName)
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }

  function handleFailedRowsDownloadClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (!preview || !importResult) return;
    downloadExport({
      data: importResult.failedRows,
      columns: buildFailedRowsExportColumns(preview.headers),
      format: "csv",
      filenameBase: importResult.failedDownloadFileName
    });
  }

  return (
    <main className={styles.layout}>
      <h1>Import Assets</h1>

      <section className={styles.importSection}>
        <div className={styles.inputRow}>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
          <IconButton
            icon={<FolderSimple />}
            variant="secondary"
            onClick={handlePickFile}
            aria-label="Select CSV file"
            disabled={isPreviewing || isImporting}
          />
          <input className={styles.fileNameField} readOnly value={fileName || "No .csv file selected."} />
          <IconButton
            icon={<ArrowRight />}
            variant="primary"
            onClick={handlePreview}
            aria-label="Preview file"
            disabled={!canPreview}
          />
        </div>

        {isPreviewing && <div className={styles.progress}>Validating preview...</div>}
        {error !== "" && <div className={styles.errorMessage}>{error}</div>}
        {activeWarnings.length > 0 && (
          <div className={styles.warningsWrap}>{activeWarnings.join(" | ")}</div>
        )}
        {importResult && importResult.outcome !== "idle" && (
          <div className={styles.importResultRow}>
            <span
              className={
                importResult.outcome === "success"
                  ? styles.successMessage
                  : importResult.outcome === "partial"
                  ? styles.partialMessage
                  : styles.failureMessage
              }
            >
              {importResult.message}
            </span>
            {(importResult.outcome === "partial" || importResult.outcome === "failure") && (
              <a href="#" className={styles.failedRowsLink} onClick={handleFailedRowsDownloadClick}>
                Download {importResult.failedCount} failed rows ({importResult.failedDownloadFileName}.csv)
              </a>
            )}
          </div>
        )}
      </section>

      {preview && (
        <section className={styles.previewSection}>
          <div className={styles.summary}>
            <span>{preview.headerMessage}</span>
            {(importResult?.outcome === "partial" || importResult?.outcome === "failure") && (
              <span>Showing failed rows only.</span>
            )}
            {(importResult === null || importResult.outcome === "idle") && (
              <>
                <span>{preview.validCount} rows ready to import.</span>
                <span>{preview.invalidCount - duplicateRowCount} rows have issues (highlighted in red).</span>
                {duplicateRowCount > 0 && (
                  <span>{duplicateRowCount} rows are duplicates and will not be imported (highlighted in yellow).</span>
                )}
                {warningRowCount > 0 && (
                  <span>{warningRowCount} rows will import without a location (highlighted in yellow).</span>
                )}
              </>
            )}
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Row</th>
                  {preview.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                  <th>Issues / Warnings</th>
                </tr>
              </thead>
              <tbody>
                {rowsToDisplay.map((row) => {
                  const rowWarnings = "warnings" in row ? (row.warnings as string[]) : [];
                  const allDuplicates = row.issues.length > 0 && row.issues.every(isDuplicateIssue);
                  const rowClass =
                    row.issues.length > 0 && !allDuplicates
                      ? styles.invalidRow
                      : rowWarnings.length > 0 || allDuplicates
                      ? styles.warningRow
                      : "";
                  return (
                    <tr key={row.rowNumber} className={rowClass}>
                      <td>{row.rowNumber}</td>
                      {preview.headers.map((header) => (
                        <td key={`${row.rowNumber}-${header}`}>{row.values[header] ?? ""}</td>
                      ))}
                      <td>
                        {row.issues.length > 0
                          ? row.issues.join(" | ")
                          : rowWarnings.length > 0
                          ? rowWarnings.join(" | ")
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showImportAction && (
            <div className={styles.importButtonSection}>
              <div className={styles.importActionRow}>
                <Button
                  className={styles.importButton}
                  variant="primary"
                  onClick={handleImport}
                  disabled={importableRows.length === 0 || isImporting}
                >
                  {isImporting ? "Importing..." : `Import ${importableRows.length} assets`}
                </Button>
                {isImporting && <span className={styles.spinner} aria-hidden="true" />}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

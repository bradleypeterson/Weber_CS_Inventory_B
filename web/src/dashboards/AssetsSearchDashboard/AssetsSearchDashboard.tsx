import { MagnifyingGlass, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { AssetDetails, AssetOverview } from "../../../../@types/data";
import { archiveAssets, fetchAssetOverviewList, fetchAssetsExport } from "../../api/assets";
import { Button } from "../../elements/Button/Button";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { Modal } from "../../elements/Modal/Modal";
import { downloadExport, type ExportColumn } from "../../export/downloadExport";
import { useFilters } from "../../filters/useFilters";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./AssetsSearchDashboard.module.css";

const PAGE_SIZE_OPTIONS: Array<10 | 25 | 50 | 100> = [10, 25, 50, 100];

const ASSETS_EXPORT_COLUMNS: ExportColumn<AssetDetails>[] = [
  { label: "Equipment ID", getValue: (row) => String(row.EquipmentID) },
  { label: "Tag Number", getValue: (row) => row.TagNumber ?? "" },
  { label: "Serial Number", getValue: (row) => row.SerialNumber ?? "" },
  { label: "Description", getValue: (row) => row.Description ?? "" },
  { label: "Department", getValue: (row) => row.DepartmentName ?? "" },
  { label: "Building", getValue: (row) => row.BuildingName ?? "" },
  { label: "Room", getValue: (row) => row.RoomNumber ?? "" },
  { label: "Barcode", getValue: (row) => row.Barcode ?? "" },
  {
    label: "Contact Person",
    getValue: (row) =>
      [row.ContactPersonFirstName, row.ContactPersonLastName].filter(Boolean).join(" ") || ""
  },
  { label: "Asset Class", getValue: (row) => row.AssetClassName ?? "" },
  { label: "Fiscal Year", getValue: (row) => row.FiscalYear ?? "" },
  { label: "Condition", getValue: (row) => row.ConditionName ?? "" },
  { label: "Device Type", getValue: (row) => row.DeviceTypeName ?? "" },
  { label: "Manufacturer", getValue: (row) => row.Manufacturer ?? "" },
  { label: "Part Number", getValue: (row) => row.PartNumber ?? "" },
  { label: "Rapid7", getValue: (row) => (row.Rapid7 === 1 ? "Yes" : row.Rapid7 === 0 ? "No" : "") },
  { label: "CrowdStrike", getValue: (row) => (row.CrowdStrike === 1 ? "Yes" : row.CrowdStrike === 0 ? "No" : "") },
  {
    label: "Archive Status",
    getValue: (row) => (row.ArchiveStatus === 1 ? "Archived" : row.ArchiveStatus === 0 ? "Active" : "")
  },
  { label: "PO Number", getValue: (row) => row.PONumber ?? "" },
  { label: "Secondary Number", getValue: (row) => row.SecondaryNumber ?? "" },
  { label: "Accounting Date", getValue: (row) => row.AccountingDate ?? "" },
  { label: "Account Cost", getValue: (row) => (row.AccountCost != null ? String(row.AccountCost) : "") }
];

export function AssetsSearchDashboard() {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50 | 100>(10);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { data, refetch } = useQuery("AssetsList", () => fetchAssetOverviewList());
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const { filters } = useFilters();
  const linkTo = useLinkTo();

  const filteredData = useMemo(() => {
    const selectedAssetClasses = filters["Asset Class"] ?? [];
    const selectedDepartments = filters.Department ?? [];

    // No selected values means "no restriction", so rows should still be shown.
    const filteredData = data?.filter((row) => {
      const assetClassMatch = selectedAssetClasses.length === 0 || selectedAssetClasses.includes(row.AssetClassID ?? 0);
      const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(row.DepartmentID ?? 0);
      return assetClassMatch && departmentMatch;
    });

    const searchedData =
      searchText === ""
        ? (filteredData ?? [])
        : (filteredData?.filter((row) =>
            Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchText))
          ) ?? []);
    return searchedData;
  }, [searchText, data, filters]);

  const totalResults = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const pagedData = useMemo(
    () => filteredData.slice((page - 1) * pageSize, page * pageSize),
    [filteredData, page, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchText, filters, data, pageSize]);

  const inspectDisabled = useMemo(() => selectedAssets.length !== 1, [selectedAssets]);
  const deleteDisabled = useMemo(() => selectedAssets.length === 0, [selectedAssets]);

  const handleExport = useCallback(async () => {
    if (!filteredData.length) return;
    const fullData = await fetchAssetsExport(filteredData.map((r) => r.EquipmentID));
    if (!fullData) return;
    downloadExport({
      data: fullData,
      columns: ASSETS_EXPORT_COLUMNS,
      format: "csv",
      filenameBase: "assets-export"
    });
  }, [filteredData]);

  function handleCheckbox(checked: boolean, equipmentID: number) {
    setSelectedAssets((prev) => {
      const nextSelectedAssets = [...prev];
      if (checked) {
        nextSelectedAssets.push(equipmentID);
      } else {
        const index = nextSelectedAssets.findIndex((id) => id === equipmentID);
        if (index > -1) nextSelectedAssets.splice(index, 1);
      }
      return nextSelectedAssets;
    });
  }

  function handleOnInspect() {
    if (selectedAssets.length !== 1) return;
    linkTo("Asset Details", ["Assets"], `assetId=${selectedAssets[0]}`);
  }

  function handleArchiveClick() {
    if (selectedAssets.length === 0) return;
    setShowConfirmModal(true);
  }

  function handleCloseConfirm() {
    if (isArchiving) return;
    setShowConfirmModal(false);
  }

  async function archiveItems() {
    try {
      setIsArchiving(true);
      const res = await archiveAssets(selectedAssets);
      if (res.status === "success") {
        setAlert("Assets successfully archived");
        setSelectedAssets([]);
        setShowConfirmModal(false);
        refetch();
        setTimeout(() => setAlert(""), 5000);
      } else {
        setError("Unable to archive items");
        setTimeout(() => setError(""), 5000);
      }
    } catch (e) {
      console.error(e);
      setError("Unable to archive items");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsArchiving(false);
    }
  }

  const columns: Column<AssetOverview>[] = [
    {
      label: "",
      render: (row: AssetOverview) => (
        <>
          <Checkbox
            color="black"
            onChange={(value) => handleCheckbox(value, row.EquipmentID)}
            checked={selectedAssets.includes(row.EquipmentID)}
          />
        </>
      )
    },
    {
      label: "Tag Number",
      dataIndex: "TagNumber"
    },
    {
      label: "Department",
      dataIndex: "Department"
    },
    {
      label: "Asset Class",
      dataIndex: "AssetClass"
    },
    {
      label: "Device Type",
      dataIndex: "DeviceType"
    }
  ];

  return (
    <main className={styles.layout}>
      <Modal isOpen={showConfirmModal} onClose={handleCloseConfirm} title="Confirm Archive">
        <p>
          Archive {selectedAssets.length} {selectedAssets.length === 1 ? "asset" : "assets"}?
        </p>
        <div className={styles.modalActions}>
          <Button variant="primary" onClick={handleCloseConfirm} disabled={isArchiving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={archiveItems} disabled={isArchiving}>
            {isArchiving ? "Archiving..." : "Confirm"}
          </Button>
        </div>
      </Modal>
      <div className={styles.tableHeader}>
        <div className={styles.row}>
          <IconButton icon={<Trash />} variant="secondary" disabled={deleteDisabled} onClick={handleArchiveClick} />
          <IconButton
            icon={<MagnifyingGlass />}
            variant="secondary"
            disabled={inspectDisabled}
            onClick={handleOnInspect}
          />
        </div>
        {alert && <span>{alert}</span>}
        {error && <span style={{ color: "red" }}>{error}</span>}
        <div className={styles.searchExportRow}>
          <IconInput
            icon={<MagnifyingGlass />}
            width="200px"
            placeholder="search"
            value={searchText}
            onChange={(val) => setSearchText(val.toLowerCase())}
          />
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            disabled={filteredData.length === 0}
          >
            Export
          </button>
        </div>
      </div>
      <DynamicTable columns={columns} data={pagedData} />
      <div className={styles.paginationRow}>
        <div className={styles.pageSizeWrap}>
          <label htmlFor="assets-search-page-size">Rows:</label>
          <select
            id="assets-search-page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as 10 | 25 | 50 | 100)}
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
            Page {page} of {totalPages} ({totalResults} results)
          </span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            {">"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default AssetsSearchDashboard;
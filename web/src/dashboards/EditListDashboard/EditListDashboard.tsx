import { FloppyDisk, Plus, X } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Modal } from "../../elements/Modal/Modal";
import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { Column, Table } from "../../elements/Table/Tables";
import { useAssetClasses, useBuildings, useConditions, useDepartments, useDeviceTypes, useRooms } from "../../hooks/optionHooks";
import { isListOptionActive, isListOptionDeleted } from "../../utils/listOptionDeleted";
import styles from "./EditListDashboard.module.css";

type ListRow = {
  id: number;
  name: string;
  abbreviation: string;
  buildingId?: number;
  deleted?: boolean;
};

type DepartmentItem = {
  DepartmentID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

type AssetClassItem = {
  AssetClassID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

type ConditionItem = {
  ConditionID: number;
  ConditionName: string;
  ConditionAbbreviation: string;
  Deleted?: number | null;
};

type DeviceTypeItem = {
  DeviceTypeID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

type BuildingItem = {
  BuildingID: number;
  Name: string;
  Abbreviation: string;
  Deleted?: number | null;
};

type RoomItem = {
  LocationID: number;
  RoomNumber: string;
  BuildingID: number;
  Barcode: string;
  Deleted?: number | null;
};

const tableConfigs = {
  department: {
    label: "Department",
    header: "Edit Department List",
    addButton: "Add Department",
    hook: useDepartments,
    idKey: "DepartmentID",
    nameKey: "Name",
    abbreviationKey: "Abbreviation"
  },
  assetClass: {
    label: "Asset Class",
    header: "Edit Asset Class List",
    addButton: "Add Asset Class",
    hook: useAssetClasses,
    idKey: "AssetClassID",
    nameKey: "Name",
    abbreviationKey: "Abbreviation"
  },
  condition: {
    label: "Condition",
    header: "Edit Condition List",
    addButton: "Add Condition",
    hook: useConditions,
    idKey: "ConditionID",
    nameKey: "ConditionName",
    abbreviationKey: "ConditionAbbreviation"
  },
  deviceType: {
    label: "Device Type",
    header: "Edit Device Type List",
    addButton: "Add Device Type",
    hook: useDeviceTypes,
    idKey: "DeviceTypeID",
    nameKey: "Name",
    abbreviationKey: "Abbreviation"
  },
  building: {
    label: "Building",
    header: "Edit Building List",
    addButton: "Add Building",
    hook: useBuildings,
    idKey: "BuildingID",
    nameKey: "Name",
    abbreviationKey: "Abbreviation"
  },
  room: {
    label: "Room",
    header: "Edit Room List",
    addButton: "Add Room",
    hook: useRooms,
    idKey: "LocationID",
    nameKey: "RoomNumber",
    abbreviationKey: "Barcode"
  }
};

type ListKey = keyof typeof tableConfigs;

export function EditListDashboard() {
  const [activeList, setActiveList] = useState<ListKey>("department");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<{ name: string; abbreviation: string; buildingId?: number }>({
    name: "",
    abbreviation: "",
    buildingId: undefined
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ name: string; abbreviation: string; buildingId?: number }>({
    name: "",
    abbreviation: "",
    buildingId: undefined
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: "save" | "delete"; id: number } | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const addAnchorRef = useRef<HTMLDivElement>(null);

  const departments = useDepartments();
  const assetClasses = useAssetClasses();
  const conditions = useConditions();
  const deviceTypes = useDeviceTypes();
  const buildings = useBuildings();
  const rooms = useRooms();

  const activeConfig = tableConfigs[activeList];

  const isAdding =
    activeList === "department"
      ? departments.isAdding
      : activeList === "assetClass"
        ? assetClasses.isAdding
        : activeList === "condition"
          ? conditions.isAdding
          : activeList === "deviceType"
            ? deviceTypes.isAdding
            : activeList === "building"
              ? buildings.isAdding
              : rooms.isAdding;

  const baseRows: ListRow[] =
    activeList === "department"
      ? (departments.data as DepartmentItem[]).map((item) => ({
          id: item.DepartmentID,
          name: item.Name,
          abbreviation: item.Abbreviation,
          deleted: isListOptionDeleted(item)
        }))
      : activeList === "assetClass"
        ? (assetClasses.data as AssetClassItem[]).map((item) => ({
            id: item.AssetClassID,
            name: item.Name,
            abbreviation: item.Abbreviation,
            deleted: isListOptionDeleted(item)
          }))
        : activeList === "condition"
          ? (conditions.data as ConditionItem[]).map((item) => ({
              id: item.ConditionID,
              name: item.ConditionName,
              abbreviation: item.ConditionAbbreviation,
              deleted: isListOptionDeleted(item)
            }))
          : activeList === "deviceType"
            ? (deviceTypes.data as DeviceTypeItem[]).map((item) => ({
                id: item.DeviceTypeID,
                name: item.Name,
                abbreviation: item.Abbreviation,
                deleted: isListOptionDeleted(item)
              }))
            : activeList === "building"
              ? (buildings.data as BuildingItem[]).map((item) => ({
                  id: item.BuildingID,
                  name: item.Name,
                  abbreviation: item.Abbreviation,
                  deleted: isListOptionDeleted(item)
                }))
              : (rooms.data as RoomItem[]).map((item) => ({
                  id: item.LocationID,
                  name: item.RoomNumber,
                  abbreviation: item.Barcode,
                  buildingId: item.BuildingID,
                  deleted: isListOptionDeleted(item)
                }));

  const rows = baseRows.map((item) =>
    editingId === item.id
      ? {
          ...item,
          name: editData.name,
          abbreviation: editData.abbreviation,
          buildingId: editData.buildingId ?? item.buildingId
        }
      : item
  );



  const filteredRows = showDeleted ? rows : rows.filter((r) => !r.deleted);

  const isRestoring =
    activeList === "department"
      ? departments.isRestoring
      : activeList === "assetClass"
        ? assetClasses.isRestoring
        : activeList === "condition"
          ? conditions.isRestoring
          : activeList === "deviceType"
            ? deviceTypes.isRestoring
            : activeList === "building"
              ? buildings.isRestoring
              : rooms.isRestoring;

  useEffect(() => {
    if (showDeleted) return;
    if (editingId === null) return;
    const current = rows.find((r) => r.id === editingId);
    if (current?.deleted) {
      setEditingId(null);
      setEditData({ name: "", abbreviation: "", buildingId: undefined });
    }
  }, [showDeleted, editingId, rows]);

  const listOptions: { value: ListKey; label: string }[] = (Object.keys(tableConfigs) as ListKey[]).map((key) => ({
    value: key,
    label: tableConfigs[key].label
  }));

  async function refetchActiveList() {
    if (activeList === "department") await departments.refetch();
    if (activeList === "assetClass") await assetClasses.refetch();
    if (activeList === "condition") await conditions.refetch();
    if (activeList === "deviceType") await deviceTypes.refetch();
    if (activeList === "building") await buildings.refetch();
    if (activeList === "room") await rooms.refetch();
  }

  const handleAdd = async () => {
    if (!newItem.name || !newItem.abbreviation) return;
    if (activeList === "room" && !newItem.buildingId) return;
    try {
      if (activeList === "department") await departments.add({ Name: newItem.name, Abbreviation: newItem.abbreviation });
      if (activeList === "assetClass") await assetClasses.add({ Name: newItem.name, Abbreviation: newItem.abbreviation });
      if (activeList === "condition")
        await conditions.add({ ConditionName: newItem.name, ConditionAbbreviation: newItem.abbreviation });
      if (activeList === "deviceType") await deviceTypes.add({ Name: newItem.name, Abbreviation: newItem.abbreviation });
      if (activeList === "building") await buildings.add({ Name: newItem.name, Abbreviation: newItem.abbreviation });
      if (activeList === "room")
        await rooms.add({ RoomNumber: newItem.name, BuildingID: newItem.buildingId!, Barcode: newItem.abbreviation });
      setNewItem({ name: "", abbreviation: "", buildingId: undefined });
      setShowAddForm(false);
      await refetchActiveList();
    } catch (error) {
      console.error(`Failed to add ${activeList}:`, error);
    }
  };

  const handleEdit = (id: number) => {
    const item = rows.find((d) => d.id === id);
    if (item && !item.deleted) {
      setEditingId(id);
      setEditData({
        name: item.name,
        abbreviation: item.abbreviation,
        buildingId: item.buildingId
      });
    }
  };

  const handleRestore = async (id: number) => {
    try {
      if (activeList === "department") await departments.restore(id);
      if (activeList === "assetClass") await assetClasses.restore(id);
      if (activeList === "condition") await conditions.restore(id);
      if (activeList === "deviceType") await deviceTypes.restore(id);
      if (activeList === "building") await buildings.restore(id);
      if (activeList === "room") await rooms.restore(id);
      setEditingId(null);
      await refetchActiveList();
    } catch (error) {
      console.error(`Failed to restore ${activeList}:`, error);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editData.name || !editData.abbreviation) return;
    if (activeList === "room" && !editData.buildingId) return;
    try {
      if (activeList === "department")
        await departments.update({ DepartmentID: id, Name: editData.name, Abbreviation: editData.abbreviation });
      if (activeList === "assetClass")
        await assetClasses.update({ AssetClassID: id, Name: editData.name, Abbreviation: editData.abbreviation });
      if (activeList === "condition")
        await conditions.update({
          ConditionID: id,
          ConditionName: editData.name,
          ConditionAbbreviation: editData.abbreviation
        });
      if (activeList === "deviceType")
        await deviceTypes.update({ DeviceTypeID: id, Name: editData.name, Abbreviation: editData.abbreviation });
      if (activeList === "building")
        await buildings.update({ BuildingID: id, Name: editData.name, Abbreviation: editData.abbreviation });
      if (activeList === "room")
        await rooms.update({
          LocationID: id,
          RoomNumber: editData.name,
          BuildingID: editData.buildingId!,
          Barcode: editData.abbreviation
        });
      setEditingId(null);
      await refetchActiveList();
    } catch (error) {
      console.error(`Failed to update ${activeList}:`, error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      if (activeList === "department") await departments.remove(id);
      if (activeList === "assetClass") await assetClasses.remove(id);
      if (activeList === "condition") await conditions.remove(id);
      if (activeList === "deviceType") await deviceTypes.remove(id);
      if (activeList === "building") await buildings.remove(id);
      if (activeList === "room") await rooms.remove(id);
      setEditingId(null);
      await refetchActiveList();
    } catch (error) {
      console.error(`Failed to delete ${activeList}:`, error);
    }
  };

  const roomBuildingOptions =
    (buildings.data as BuildingItem[])
      .filter(isListOptionActive)
      .map((b) => ({ value: b.BuildingID, label: `${b.Abbreviation} - ${b.Name}` })) ?? [];

  useLayoutEffect(() => {
    if (!showAddForm) return;
    addAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [showAddForm]);

  const isEditingRowIndex = (rowIndex: number) => {
    const row = filteredRows[rowIndex];
    if (!row || row.deleted) return false;
    return editingId === row.id;
  };

  const columns: Column[] =
    activeList === "room"
      ? [
          { key: "name", label: "Room Number", type: "text" },
          {
            key: "buildingId",
            label: "Building",
            type: "dropdown",
            options: roomBuildingOptions,
            isEditable: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              return editingId === row?.id;
            }
          },
          { key: "abbreviation", label: "Barcode", type: "text" },
          {
            key: "edit",
            label: "Edit",
            type: "icon",
            icon: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              return editingId === row?.id ? "save" : "edit";
            },
            hidden: (rowIndex: number) => !!filteredRows[rowIndex]?.deleted,
            isDisabled: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              if (row?.deleted) return true;
              return editingId !== null && editingId !== row?.id;
            },
            width: "50px",
            action: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              if (!row) return;
              if (editingId !== null && editingId !== row.id) return;

              if (editingId === row.id) {
                setPendingAction({ type: "save", id: row.id });
                setShowConfirmModal(true);
              } else {
                handleEdit(row.id);
              }
            }
          },
          {
            key: "delete",
            label: "Delete",
            type: "icon",
            icon: "trash",
            hidden: (rowIndex: number) => !!filteredRows[rowIndex]?.deleted,
            isDisabled: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              if (row?.deleted) return true;
              return editingId !== null && editingId !== row?.id;
            },
            width: "50px",
            action: (rowIndex: number) => {
              const id = filteredRows[rowIndex]?.id;
              if (!id) return;
              if (editingId !== null && editingId !== id) return;
              setPendingAction({ type: "delete", id });
              setShowConfirmModal(true);
            }
          },
          ...(showDeleted
            ? ([
                {
                  key: "restore",
                  label: "Restore",
                  type: "icon" as const,
                  icon: "restore",
                  hidden: (rowIndex: number) => !filteredRows[rowIndex]?.deleted,
                  isDisabled: () => editingId !== null || isRestoring,
                  width: "50px",
                  action: (rowIndex: number) => {
                    const id = filteredRows[rowIndex]?.id;
                    if (!id) return;
                    void handleRestore(id);
                  }
                }
              ] satisfies Column[])
            : [])
        ]
      : [
          { key: "name", label: tableConfigs[activeList].label, type: "text" },
          { key: "abbreviation", label: "Abbreviation", type: "text" },
          {
            key: "edit",
            label: "Edit",
            type: "icon",
            icon: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              return editingId === row?.id ? "save" : "edit";
            },
            hidden: (rowIndex: number) => !!filteredRows[rowIndex]?.deleted,
            isDisabled: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              if (row?.deleted) return true;
              return editingId !== null && editingId !== row?.id;
            },
            width: "50px",
            action: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              if (!row) return;
              if (editingId !== null && editingId !== row.id) return;

              if (editingId === row.id) {
                setPendingAction({ type: "save", id: row.id });
                setShowConfirmModal(true);
              } else {
                handleEdit(row.id);
              }
            }
          },
          {
            key: "delete",
            label: "Delete",
            type: "icon",
            icon: "trash",
            hidden: (rowIndex: number) => !!filteredRows[rowIndex]?.deleted,
            isDisabled: (rowIndex: number) => {
              const row = filteredRows[rowIndex];
              if (row?.deleted) return true;
              return editingId !== null && editingId !== row?.id;
            },
            width: "50px",
            action: (rowIndex: number) => {
              const id = filteredRows[rowIndex]?.id;
              if (!id) return;
              if (editingId !== null && editingId !== id) return;
              setPendingAction({ type: "delete", id });
              setShowConfirmModal(true);
            }
          },
          ...(showDeleted
            ? ([
                {
                  key: "restore",
                  label: "Restore",
                  type: "icon" as const,
                  icon: "restore",
                  hidden: (rowIndex: number) => !filteredRows[rowIndex]?.deleted,
                  isDisabled: () => editingId !== null || isRestoring,
                  width: "50px",
                  action: (rowIndex: number) => {
                    const id = filteredRows[rowIndex]?.id;
                    if (!id) return;
                    void handleRestore(id);
                  }
                }
              ] satisfies Column[])
            : [])
        ];

  const modalContent = pendingAction
    ? pendingAction.type === "save"
      ? {
          title: "Confirm Changes",
          message: "Are you sure you want to save these changes?"
        }
      : {
          title: "Confirm Deletion",
          message: `Are you sure you want to delete this ${activeConfig.label.toLowerCase()}?`
        }
    : { title: "", message: "" };

  function handleCancelConfirm() {
    if (pendingAction?.type === "save") {
      setEditingId(null);
      setEditData({ name: "", abbreviation: "", buildingId: undefined });
    }
    setPendingAction(null);
    setShowConfirmModal(false);
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "save") await handleSaveEdit(pendingAction.id);
    if (pendingAction.type === "delete") await handleDelete(pendingAction.id);
    setPendingAction(null);
    setShowConfirmModal(false);
  }

  return (
    <div className={styles.layout}>
      <Modal isOpen={showConfirmModal} onClose={handleCancelConfirm} title={modalContent.title}>
        <p>{modalContent.message}</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={handleCancelConfirm}
            style={{ padding: "8px 16px", background: "#b7b7b7", border: "none", borderRadius: "4px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAction}
            style={{ padding: "8px 16px", background: "#7300ff", color: "white", border: "none", borderRadius: "4px" }}
          >
            Confirm
          </button>
        </div>
      </Modal>

      <div className={styles.sidebar}>
        <h2 style={{ marginBottom: "20px" }}>Select Editable List</h2>
        <SingleSelect<ListKey>
          options={listOptions}
          value={activeList}
          onChange={(value) => {
            setActiveList(value);
            setShowAddForm(false);
            setEditingId(null);
            setPendingAction(null);
            setShowConfirmModal(false);
            setEditData({ name: "", abbreviation: "", buildingId: undefined });
            setNewItem({ name: "", abbreviation: "", buildingId: undefined });
          }}
          placeholder="Select a list"
          width="100%"
        />
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{activeConfig.header}</h1>
            <div className={styles.pageHeaderActions}>
              <label className={styles.showDeletedLabel}>
                <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                Show deleted
              </label>
              {!showAddForm && (
                <button type="button" className={styles.outlineButton} onClick={() => setShowAddForm(true)}>
                  <Plus size={16} /> {activeConfig.addButton}
                </button>
              )}
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <Table
              key={activeList}
              columns={columns}
              data={filteredRows}
              isRowEditable={isEditingRowIndex}
              rowClassName={(rowIndex) => (filteredRows[rowIndex]?.deleted ? styles.rowDeleted : undefined)}
              setEditData={setEditData}
              onDataChange={(updated: ListRow[]) => {
                const editingRow = updated.find((d) => d.id === editingId);
                if (editingRow) {
                  setEditData({
                    name: editingRow.name,
                    abbreviation: editingRow.abbreviation,
                    buildingId: editingRow.buildingId
                  });
                }
              }}
            />

            <div ref={addAnchorRef} className={styles.addAnchor}>
              {showAddForm ? (
                <div className={styles.addSection} style={{ marginTop: "20px" }}>
                  {activeList === "room" && (
                    <SingleSelect<number>
                      options={roomBuildingOptions}
                      value={newItem.buildingId ?? 0}
                      onChange={(value) => setNewItem({ ...newItem, buildingId: Number(value) })}
                      placeholder="Select Building"
                      width="100%"
                    />
                  )}
                  <input
                    type="text"
                    placeholder={activeList === "room" ? "Room Number" : `${activeConfig.label} Name`}
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className={styles.inputField}
                  />
                  <input
                    type="text"
                    placeholder={activeList === "room" ? "Barcode" : "Abbreviation"}
                    value={newItem.abbreviation}
                    onChange={(e) => setNewItem({ ...newItem, abbreviation: e.target.value })}
                    className={styles.inputField}
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={
                      isAdding || !newItem.name || !newItem.abbreviation || (activeList === "room" && !newItem.buildingId)
                    }
                    className={styles.addButton}
                  >
                    {isAdding ? (
                      "Adding..."
                    ) : (
                      <>
                        <FloppyDisk size={16} /> Save
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className={styles.iconButton} style={{ marginLeft: "10px" }}>
                    <X size={20} /> Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

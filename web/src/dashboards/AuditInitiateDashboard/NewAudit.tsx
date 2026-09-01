import { ArrowRight, Barcode } from "@phosphor-icons/react";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router-dom";
import type { APIResponse } from "../../../../@types/api";
import { ItemNoteModal } from "../../components/ItemNotes/ItemNoteModal";
import { ItemNotes } from "../../components/ItemNotes/ItemNotes";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { Modal } from "../../elements/Modal/Modal";
import { Column, Table } from "../../elements/Table/Tables";
import { useFilters } from "../../filters/useFilters";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./NewAudit.module.css";

interface EquipmentDetailsRow {
  EquipmentID: number;
  TagNumber: string;
  SerialNumber: string;
  Description: string;
  DepartmentID: number;
  DepartmentName: string;
  LocationID: number;
  RoomNumber: string;
  BuildingID: number;
  BuildingName: string;
  BuildingAbbr: string;
  DeviceTypeName: string;
  status?: number;
}

// Define type for item notes
interface ItemNote {
  tagNumber: string;
  note: string;
}

export function NewAudit() {
  const { permissions } = useAuth();
  const linkTo = useLinkTo();
  const { filters } = useFilters();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room_id');
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [itemStatuses, setItemStatuses] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<EquipmentDetailsRow | null>(null);
  const [addedItems, setAddedItems] = useState<EquipmentDetailsRow[]>([]);
  const [itemNotes, setItemNotes] = useState<ItemNote[]>([]);
  const [isRowNoteModalOpen, setIsRowNoteModalOpen] = useState(false);
  const [activeNoteTag, setActiveNoteTag] = useState("");
  const [activeNoteLabel, setActiveNoteLabel] = useState("");
  const [activeInitialNote, setActiveInitialNote] = useState("");
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to clear all state and storage
  const clearAllState = useCallback(() => {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('audit_') || key === 'current_room_id') {
        localStorage.removeItem(key);
      }
    });

    // Reset all state
    setAddedItems([]);
    setItemStatuses({});
    setPendingItem(null);
    setBarcode("");
    setError("");
    setItemNotes([]);
    setSubmitError(null);

    // Clear React Query cache for all equipment data
    queryClient.removeQueries(["equipmentInRoom"]);
  }, [queryClient]);

  const { data: equipmentData, isLoading } = useQuery<APIResponse<EquipmentDetailsRow[]>>(
    ["equipmentInRoom", roomId],
    async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/audits/equipment/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch equipment data');
      }

      const data = await response.json();
      
      // Get stored items for this room
      const savedItems = localStorage.getItem(`audit_added_items_${roomId}`);
      let additionalItems: EquipmentDetailsRow[] = [];

      if (savedItems) {
        try {
          additionalItems = JSON.parse(savedItems);
        } catch (error) {
          console.error('Error parsing saved items:', error);
        }
      }
      
      // Combine server data with stored items
      if (data.status === "success") {
        return {
          ...data,
          data: [...data.data, ...additionalItems]
        };
      }
      
      return data;
    },
    {
      enabled: !!roomId,
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );
  const equipmentRows = equipmentData?.status === "success" ? equipmentData.data : [];

  const scanItem = useMutation({
    mutationFn: async (itemBarcode: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/audits/scan-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          itemBarcode,
          roomId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to scan item');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setError("");
      setBarcode("");

      if (data.status === "not_assigned_to_room") {
        setPendingItem(data.data);
        setIsModalOpen(true);
      } else {
        // Only set status to "Found" if the item doesn't already have a status
        if (data.data.TagNumber && !itemStatuses[data.data.TagNumber]) {
          setItemStatuses(prev => ({
            ...prev,
            [data.data.TagNumber]: 1
          }));
        }
      }
    },
    onError: (error) => {
      console.error('Failed to scan item:', error);
      setBarcode("");
      setError("Invalid item barcode");
    }
  });

  const handleScanSubmit = () => {
    if (!barcode) return;
    scanItem.mutate(barcode);
  };

  const handleStatusChange = (value: number, rowIndex: number) => {
    if (!equipmentRows[rowIndex]) return;
    const tagNumber = equipmentRows[rowIndex].TagNumber;
    setItemStatuses(prev => ({
      ...prev,
      [tagNumber]: value
    }));
  };

  const handleAddItemNote = (tagNumber: string, note: string) => {
    // Check if a note already exists for this tag number
    const existingNoteIndex = itemNotes.findIndex(item => item.tagNumber === tagNumber);
    
    if (existingNoteIndex >= 0) {
      // Replace the existing note
      const updatedNotes = [...itemNotes];
      updatedNotes[existingNoteIndex] = { tagNumber, note };
      setItemNotes(updatedNotes);
    } else {
      // Add a new note
      setItemNotes(prev => [...prev, { tagNumber, note }]);
    }
  };

  const openRowNoteModal = (row: EquipmentDetailsRow) => {
    const existingNote = itemNotes.find((item) => item.tagNumber === row.TagNumber);
    setActiveNoteTag(row.TagNumber);
    setActiveNoteLabel(`${row.TagNumber} - ${row.Description || "Unknown"}`);
    setActiveInitialNote(existingNote?.note || "");
    setIsRowNoteModalOpen(true);
  };

  const closeRowNoteModal = () => {
    setIsRowNoteModalOpen(false);
    setActiveNoteTag("");
    setActiveNoteLabel("");
    setActiveInitialNote("");
  };

  const handleSaveRowNote = (tagNumber: string, note: string) => {
    handleAddItemNote(tagNumber, note);
    closeRowNoteModal();
  };

  const handleDeleteItemNote = (tagNumber: string) => {
    setItemNotes((prev) => prev.filter((note) => note.tagNumber !== tagNumber));
    if (activeNoteTag === tagNumber) {
      closeRowNoteModal();
    }
  };

  const handleAddItemToAudit = () => {
    if (pendingItem && equipmentRows[0]) {
      // Check if item is already in the list
      const isItemAlreadyAdded = addedItems.some((item: EquipmentDetailsRow) => item.TagNumber === pendingItem.TagNumber) ||
        equipmentRows.some((item: EquipmentDetailsRow) => item.TagNumber === pendingItem.TagNumber);

      if (isItemAlreadyAdded) {
        setError(`Item ${pendingItem.TagNumber} is already in the audit list`);
        setIsModalOpen(false);
        setPendingItem(null);
        return;
      }

      // Ensure we're using the tag number as a string
      const tagNumber = String(pendingItem.TagNumber);

      // Add item to the list with "Turned-In" status (4)
      setItemStatuses(prev => ({
        ...prev,
        [tagNumber]: 4
      }));
      
      // Add to our local state of added items
      setAddedItems(prev => [...prev, pendingItem]);

      // Add automatic note for unassigned item using current room's building abbreviation + room number
      const currentRoom = equipmentRows[0];
      const locationBarcode = `${currentRoom.BuildingAbbr}${currentRoom.RoomNumber}`;
      
      // Ensure consistent tag number format for notes
      console.log(`Adding note for item ${tagNumber} found at ${locationBarcode}`);
      
      // Add as an item-specific note with consistent tag number format
      setItemNotes(prev => [...prev, {
        tagNumber,
        note: `Found at ${locationBarcode}`
      }]);
      
      // Update the cache with the new item
      queryClient.setQueryData<APIResponse<EquipmentDetailsRow[]>>(
        ["equipmentInRoom", roomId],
        (oldData: APIResponse<EquipmentDetailsRow[]> | undefined) => {
          if (!oldData || oldData.status !== "success") {
            return {
              status: "success",
              data: [pendingItem]
            };
          }
          return {
            ...oldData,
            data: [...oldData.data, pendingItem]
          };
        }
      );
    }
    setIsModalOpen(false);
    setPendingItem(null);
  };

  const handleCancelAdd = () => {
    setIsModalOpen(false);
    setPendingItem(null);
    setBarcode("");
  };

  const filteredData = useMemo(() => {
    if (!equipmentData || equipmentData.status !== "success") return [];
    
    return equipmentData.data
      .filter((row: EquipmentDetailsRow) => {
        const departmentMatch = !filters.Department?.length || filters.Department.includes(row.DepartmentID);
        const buildingMatch = !filters.Building?.length || filters.Building.includes(row.BuildingID);
        const locationMatch = !filters.Room?.length || filters.Room.includes(row.LocationID);
        
        return departmentMatch && buildingMatch && locationMatch;
      })
      .map((row: EquipmentDetailsRow) => ({
        ...row,
        status: itemStatuses[row.TagNumber] ?? row.status
      }));
  }, [filters, equipmentData, itemStatuses]);

  const columns: Column[] = useMemo(
    () => [
      {
        label: "Tag Number",
        key: "TagNumber",
        type: "text"
      },
      {
        label: "Description",
        key: "Description",
        type: "text"
      },
      {
        label: "Serial Number",
        key: "SerialNumber",
        type: "text"
      },
      {
        label: "Room",
        key: "RoomNumber",
        type: "text"
      },
      {
        label: "Building",
        key: "BuildingName",
        type: "text"
      },
      {
        label: "Status",
        key: "status",
        type: "dropdown",
        options: [
          { value: 1, label: "Found" },
          { value: 2, label: "Damaged" },
          { value: 3, label: "Missing" },
          { value: 4, label: "Turned-In" }
        ]
      },
      {
        label: "Note",
        key: "note",
        type: "icon",
        icon: (rowIndex: number) => {
          const row = filteredData[rowIndex];
          if (!row) return "plus";
          const existingNote = itemNotes.some((item) => item.tagNumber === row.TagNumber);
          return existingNote ? "note-edit" : "plus";
        },
        width: "50px",
        action: (rowIndex: number) => {
          const row = filteredData[rowIndex];
          if (row) {
            openRowNoteModal(row);
          }
        }
      }
    ],
    [filteredData, itemNotes]
  );

  const handleSubmit = () => {
    // Check if all items have a status
    const itemsWithoutStatus = filteredData.filter((item: EquipmentDetailsRow) => item.status === undefined || item.status === null);
    
    if (itemsWithoutStatus.length > 0) {
      setSubmitError(`Please assign a status to all items (${itemsWithoutStatus.length} remaining)`);
      return;
    }
    
    // Store current room ID, item statuses, and item notes for the summary page
    if (roomId) {
      localStorage.setItem('current_room_id', roomId);
      localStorage.setItem(`audit_item_statuses_${roomId}`, JSON.stringify(itemStatuses));
      localStorage.setItem(`audit_item_notes_${roomId}`, JSON.stringify(itemNotes));
    }
    
    // Clear error and proceed with submission
    setSubmitError(null);
    linkTo("Audit Summary", ["Audits", "Initiate Audit"]);
  };

  // Check if we're returning from summary page or refreshing
  useEffect(() => {
    const storedRoomId = localStorage.getItem('current_room_id');
    
    // If we have a roomId and it matches the stored room, restore state
    if (roomId && storedRoomId === roomId) {
      const savedItemNotes = localStorage.getItem(`audit_item_notes_${roomId}`);
      const savedAddedItems = localStorage.getItem(`audit_added_items_${roomId}`);
      const savedStatuses = localStorage.getItem(`audit_item_statuses_${roomId}`);

      if (savedItemNotes) {
        try {
          setItemNotes(JSON.parse(savedItemNotes));
        } catch (error) {
          console.error('Error loading saved item notes:', error);
        }
      }
      
      if (savedAddedItems) {
        try {
          const items = JSON.parse(savedAddedItems);
          setAddedItems(items);
          // Update the React Query cache with the added items
          queryClient.setQueryData<APIResponse<EquipmentDetailsRow[]>>(
            ["equipmentInRoom", roomId],
            (oldData: APIResponse<EquipmentDetailsRow[]> | undefined) => {
              if (!oldData || oldData.status !== "success") {
                return {
                  status: "success",
                  data: items
                };
              }
              // Combine existing data with added items, avoiding duplicates
              const existingTagNumbers = new Set(oldData.data.map((item: EquipmentDetailsRow) => item.TagNumber));
              const newItems = items.filter((item: EquipmentDetailsRow) => !existingTagNumbers.has(item.TagNumber));
              return {
                ...oldData,
                data: [...oldData.data, ...newItems]
              };
            }
          );
        } catch (error) {
          console.error('Error loading saved added items:', error);
        }
      }

      if (savedStatuses) {
        try {
          setItemStatuses(JSON.parse(savedStatuses));
        } catch (error) {
          console.error('Error loading saved statuses:', error);
        }
      }
    } else if (!storedRoomId) {
      // Only clear state if there's no stored room ID (new audit)
      clearAllState();
    }
  }, [roomId, queryClient, clearAllState]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (roomId) {
      if (addedItems.length > 0) {
        localStorage.setItem(`audit_added_items_${roomId}`, JSON.stringify(addedItems));
      } else {
        localStorage.removeItem(`audit_added_items_${roomId}`);
      }

      if (itemNotes.length > 0) {
        localStorage.setItem(`audit_item_notes_${roomId}`, JSON.stringify(itemNotes));
      } else {
        localStorage.removeItem(`audit_item_notes_${roomId}`);
      }

      if (Object.keys(itemStatuses).length > 0) {
        localStorage.setItem(`audit_item_statuses_${roomId}`, JSON.stringify(itemStatuses));
        localStorage.setItem('current_room_id', roomId);
      } else {
        localStorage.removeItem(`audit_item_statuses_${roomId}`);
        localStorage.removeItem('current_room_id');
      }
    }
  }, [addedItems, itemNotes, itemStatuses, roomId]);

  // Also check and update error message whenever filtered data or statuses change
  useEffect(() => {
    const itemsWithoutStatus = filteredData.filter((item: EquipmentDetailsRow) => item.status === undefined || item.status === null);
    if (itemsWithoutStatus.length === 0) {
      setSubmitError(null);
    }
  }, [filteredData]);

  if (!hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS)) {
    return (
      <main className={styles.layout}>
        <div className={styles.row}>
          <div style={{ color: "red" }}>You do not have permission to perform audits.</div>
        </div>
      </main>
    );
  }

  // Handle navigation attempts
  const handleNavigationAttempt = (destination: string) => {
    if (addedItems.length > 0 || Object.keys(itemStatuses).length > 0) {
      setIsNavigationModalOpen(true);
      setPendingNavigation(destination);
    } else {
      handleNavigate(destination);
    }
  };

  const handleNavigate = (destination: string) => {
    // Only clear state when explicitly starting a new audit or canceling
    if (destination === "Initiate Audit") {
      clearAllState();
    }
    
    linkTo(destination, destination === "Initiate Audit" ? ["Audits"] : undefined);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.layout}>
      <main className={styles.content}>
        <div className={styles.scanSection}>
          <div className={styles.errorMessage}>
            {error}
          </div>
          <div className={styles.inputRow}>
            <IconInput
              placeholder="Scan Item Barcode"
              icon={<Barcode />}
              width="350px"
              value={barcode}
              onChange={(value) => setBarcode(value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScanSubmit();
                }
              }}
              autoFocus
            />
            <IconButton
              icon={<ArrowRight />}
              variant="primary"
              disabled={barcode === "" || scanItem.isLoading}
              onClick={handleScanSubmit}
            />
          </div>
        </div>
        <Table 
          columns={columns} 
          data={filteredData} 
          selectable={true} 
          onDataChange={(newData: EquipmentDetailsRow[]) => {
            // Find the changed row by comparing with current data
            const changedRow = newData.find((row: EquipmentDetailsRow, index: number) => 
              row.status !== filteredData[index].status
            );
            
            if (changedRow && typeof changedRow.status === 'number') {
              // Find the index in the original data
              const rowIndex = equipmentRows.findIndex(
                (item: EquipmentDetailsRow) => item.TagNumber === changedRow.TagNumber
              );
              
              if (rowIndex !== -1) {
                handleStatusChange(changedRow.status, rowIndex);
              }
            }
          }}
        />
        <ItemNotes 
          itemNotes={itemNotes} 
          equipmentItems={[...equipmentRows, ...addedItems]}
          onAdd={handleAddItemNote}
          onDelete={handleDeleteItemNote}
        />
        <div className={styles.buttons}>
          <div className={styles.errorMessage}>
            {submitError}
          </div>
          <div className={styles.buttonRow}>
            <button 
              className={styles.cancelButton}
              onClick={() => handleNavigationAttempt("Initiate Audit")}
            >
              Cancel
            </button>
            <button 
              className={styles.submitButton}
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelAdd}
        title="Item not Assigned to this Room"
      >
        <div className={styles.modalContent}>
          <p>Would you like to add it to the Audit</p>
          <div className={styles.modalButtons}>
            <button onClick={handleCancelAdd} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleAddItemToAudit} className={styles.submitButton}>
              Yes
            </button>
          </div>
        </div>
      </Modal>

      <ItemNoteModal
        isOpen={isRowNoteModalOpen}
        onClose={closeRowNoteModal}
        onSave={handleSaveRowNote}
        tagNumber={activeNoteTag}
        itemLabel={activeNoteLabel}
        initialNote={activeInitialNote}
        mode={activeInitialNote ? "edit" : "add"}
        onDelete={handleDeleteItemNote}
      />

      <Modal
        isOpen={isNavigationModalOpen}
        onClose={() => {
          setIsNavigationModalOpen(false);
          setPendingNavigation(null);
        }}
        title="Unsaved Changes"
      >
        <div className={styles.modalContent}>
          <p>Leaving this page will end your audit session. Continue?</p>
          <div className={styles.modalButtons}>
            <button 
              onClick={() => {
                setIsNavigationModalOpen(false);
                setPendingNavigation(null);
              }} 
              className={styles.cancelButton}
            >
              Stay
            </button>
            <button 
              onClick={() => {
                if (pendingNavigation) {
                  handleNavigate(pendingNavigation);
                }
              }} 
              className={styles.submitButton}
            >
              Leave
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

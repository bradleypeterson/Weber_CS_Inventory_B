import { MagnifyingGlass, Pencil, Plus, Trash, UserPlus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { ContactOverview } from "../../../../@types/data";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { archiveContacts, fetchContactList } from "../../api/contacts";
import { Button } from "../../elements/Button/Button";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { Modal } from "../../elements/Modal/Modal";
import { useFilters } from "../../filters/useFilters";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./ContactSearchDashboard.module.css";

export function ContactSearchDashboard() {
  const [searchText, setSearchText] = useState("");
  const [selectedContact, setSelectedContact] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const linkTo = useLinkTo();
  const { data, refetch } = useQuery("ContactsList", () => fetchContactList());
  const { filters } = useFilters();
  const { permissions } = useAuth();

  const filteredData = useMemo(() => {
    const selectedDepartments = filters.Department ?? [];

    // No department selection means show all rows for this page.
    const filteredData = data?.filter((row) => {
      if (selectedDepartments.length === 0) return true;
      return row.DepartmentID?.some((department) => selectedDepartments.includes(department)) ?? false;
    });

    const searchedData =
      searchText === ""
        ? (filteredData ?? [])
        : (filteredData?.filter((row) =>
            Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchText))
          ) ?? []);
    return searchedData;
  }, [searchText, data, filters]);

  const editDisabled = useMemo(() => selectedContact.length !== 1, [selectedContact]);
  const deleteDisabled = useMemo(() => selectedContact.length === 0, [selectedContact]);
  const convertDisabled = useMemo(() => selectedContact.length !== 1, [selectedContact]);
  const canManageContacts = hasPermission(permissions, PermissionId.ADD_EDIT_CONTACT_PERSONS);
  const canManageUsers = hasPermission(permissions, PermissionId.ADD_EDIT_VIEW_USERS);
  const canConvertContact = canManageContacts && canManageUsers;

  function handleCheckbox(checked: boolean, personID: number) {
    setSelectedContact((prev) => {
      const nextSelectedContacts = [...prev];
      if (checked) {
        nextSelectedContacts.push(personID);
      } else {
        const index = nextSelectedContacts.findIndex((id) => id === personID);
        if (index > -1) nextSelectedContacts.splice(index, 1);
      }
      return nextSelectedContacts;
    });
  }

  function handlePlusClick() {
    linkTo("Details", ["Admin", "Contacts"]);
  }

  function handleOnEdit() {
    if (selectedContact.length !== 1) return;
    linkTo("Details", ["Admin", "Contacts"], `personID=${selectedContact[0]}`);
  }

  function handleArchiveClick() {
    if (selectedContact.length === 0) return;
    setShowConfirmModal(true);
  }

  function handleConvertClick() {
    if (selectedContact.length !== 1) return;
    const personID = selectedContact[0];
    setSelectedContact([]);
    linkTo("Details", ["Admin", "Users"], `sourcePersonID=${personID}`);
  }

  function handleCloseConfirm() {
    if (isArchiving) return;
    setShowConfirmModal(false);
  }

  async function archiveItems() {
    try {
      setIsArchiving(true);
      const res = await archiveContacts(selectedContact);
      if (res.status === "success") {
        setAlert("Contacts successfully archived");
        setSelectedContact([]);
        setShowConfirmModal(false);
        refetch();
        setTimeout(() => setAlert(""), 5000);
      } else {
        setError(res.error.message ?? "Unable to archive contacts");
        setTimeout(() => setError(""), 5000);
      }
    } catch (e) {
      console.error(e);
      setError("Unable to archive contacts");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsArchiving(false);
    }
  }

  const columns: Column<ContactOverview>[] = [
    {
      label: "",
      render: (row: ContactOverview) => (
        <>
          <Checkbox
            color="black"
            onChange={(value) => row.PersonID !== undefined && handleCheckbox(value, row.PersonID)}
            checked={row.PersonID !== undefined && selectedContact.includes(row.PersonID)}
          />
        </>
      )
    },
    { label: "W Number", dataIndex: "WNumber" },
    { label: "Name", dataIndex: "FullName" },
    { label: "Department", dataIndex: "Departments" },
    { label: "Location", dataIndex: "Location" }
  ];

  return (
    <main className={styles.layout}>
      <Modal isOpen={showConfirmModal} onClose={handleCloseConfirm} title="Confirm Archive">
        <p>
          Archive {selectedContact.length} {selectedContact.length === 1 ? "contact" : "contacts"}?
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
          {canManageContacts && (
            <IconButton icon={<Trash />} variant="secondary" disabled={deleteDisabled} onClick={handleArchiveClick} />
          )}
          {canManageContacts && (
            <IconButton icon={<Pencil />} variant="secondary" disabled={editDisabled} onClick={handleOnEdit} />
          )}
          {canConvertContact && (
            <IconButton icon={<UserPlus />} variant="secondary" disabled={convertDisabled} onClick={handleConvertClick} />
          )}
          {canManageContacts && <IconButton icon={<Plus />} variant="secondary" onClick={handlePlusClick} />}
        </div>
        {alert && <span>{alert}</span>}
        {error && <span style={{ color: "red" }}>{error}</span>}
        <IconInput
          icon={<MagnifyingGlass />}
          width="200px"
          placeholder="search"
          value={searchText}
          onChange={(val) => setSearchText(val.toLowerCase())}
        />
      </div>
      <DynamicTable columns={columns} data={filteredData} />
    </main>
  );
}

export default ContactSearchDashboard;

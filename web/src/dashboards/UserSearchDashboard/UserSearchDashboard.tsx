import { MagnifyingGlass, Pencil, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { UserOverview } from "../../../../@types/data";
import { archiveUsers, fetchUserList } from "../../api/users";
import { Button } from "../../elements/Button/Button";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { Column, DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { Modal } from "../../elements/Modal/Modal";
import { useFilters } from "../../filters/useFilters";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./UserSearchDashboard.module.css";

export function UserSearchDashboard() {
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const linkTo = useLinkTo();
  const { data, refetch } = useQuery("UsersList", () => fetchUserList());
  const { filters } = useFilters();

  const filteredData = useMemo(() => {
    const selectedDepartments = filters.Department ?? [];
    const selectedPermissions = filters.Permission ?? [];

    // Empty selections mean "include all" for that filter dimension.
    const filteredData = data?.filter((row) => {
      const departmentMatch =
        selectedDepartments.length === 0 ||
        (row.DepartmentID?.some((department) => selectedDepartments.includes(department)) ?? false);

      const permissionMatch =
        selectedPermissions.length === 0 ||
        (row.Permissions?.some((permission) => selectedPermissions.includes(Number(permission))) ?? false);

      return departmentMatch && permissionMatch;
    });

    const searchedData =
      searchText === ""
        ? (filteredData ?? [])
        : (filteredData?.filter((row) =>
            Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchText))
          ) ?? []);
    return searchedData;
  }, [searchText, data, filters]);

  const editDisabled = useMemo(() => selectedUser.length !== 1, [selectedUser]);
  const deleteDisabled = useMemo(() => selectedUser.length === 0, [selectedUser]);

  function handleCheckbox(checked: boolean, personID: number) {
    setSelectedUser((prev) => {
      const nextSelectedUsers = [...prev];
      if (checked) {
        nextSelectedUsers.push(personID);
      } else {
        const index = nextSelectedUsers.findIndex((id) => id === personID);
        if (index > -1) nextSelectedUsers.splice(index, 1);
      }
      return nextSelectedUsers;
    });
  }
  
  function handlePlusClick() {
    linkTo("Details", ["Admin", "Users"]);
  }

  function handleOnEdit() {
    if (selectedUser.length !== 1) return;
    linkTo("Details", ["Admin", "Users"], `personID=${selectedUser[0]}`);
  }

  function handleArchiveClick() {
    if (selectedUser.length === 0) return;
    setShowConfirmModal(true);
  }

  function handleCloseConfirm() {
    if (isArchiving) return;
    setShowConfirmModal(false);
  }

  async function archiveItems() {
    try {
      setIsArchiving(true);
      const res = await archiveUsers(selectedUser);
      if (res.status === "success") {
        setAlert("Users successfully archived");
        setSelectedUser([]);
        setShowConfirmModal(false);
        refetch();
        setTimeout(() => setAlert(""), 5000);
      } else {
        setError(res.error.message ?? "Unable to archive users");
        setTimeout(() => setError(""), 5000);
      }
    } catch (e) {
      console.error(e);
      setError("Unable to archive users");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsArchiving(false);
    }
  }
  
  const columns: Column<UserOverview>[] = [
    {
      label: "",
      render: (row: UserOverview) => (
        <>
          <Checkbox
            color="black"
            onChange={(value) => row.PersonID !== undefined && handleCheckbox(value, row.PersonID)}
            checked={row.PersonID !== undefined && selectedUser.includes(row.PersonID)}
          />
        </>
      )
    },
    { label: "W Number", dataIndex: "WNumber" },
    { label: "Name", dataIndex: "Name" },
    { label: "Department", dataIndex: "Departments" },
    { label: "Location", dataIndex: "Location" }
  ];
  
  return (
    <main className={styles.layout}>
      <Modal isOpen={showConfirmModal} onClose={handleCloseConfirm} title="Confirm Archive">
        <p>
          Archive {selectedUser.length} {selectedUser.length === 1 ? "user" : "users"}?
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
          <IconButton icon={<Pencil />} variant="secondary" disabled={editDisabled} onClick={handleOnEdit} />
          <IconButton icon={<Plus />} variant="secondary" onClick={handlePlusClick} />
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


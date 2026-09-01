import { Check, Pencil } from "@phosphor-icons/react";
import { ALL_PERMISSION_IDS, PERMISSION_DISPLAY_NAMES, PermissionId, hasPermission } from "../../../../@types/permissions";
import CryptoJS from "crypto-js";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router";
import { Building, Department, Room } from "../../../../@types/data";
import { fetchContactDetails } from "../../api/contacts";
import { addUserDetails, fetchUserDetails, promoteContactUserDetails, updateUserDetails } from "../../api/users";
import {
  HistoryChangesSection,
  PERSON_SYSTEM_NOTE_ENTITY_TYPES
} from "../../components/HistoryChangesSection/HistoryChangesSection";
import { Button } from "../../elements/Button/Button";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { IconButton } from "../../elements/IconButton/IconButton";
import { LabelInput } from "../../elements/LabelInput/LabelInput";
import { Modal } from "../../elements/Modal/Modal";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { TextArea } from "../../elements/TextArea/TextArea";
import {
  useBuildings,
  useDepartments,
  useRooms,
} from "../../hooks/optionHooks";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./UserDetailsDashboard.module.css";

export function UserDetailsDashboard() {
  const [searchParams] = useSearchParams();
  const personID = useMemo(() => searchParams.get("personID"), [searchParams]);
  const sourcePersonID = useMemo(() => searchParams.get("sourcePersonID"), [searchParams]);
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { permissions } = useAuth();

  if (
    buildingsLoading ||
    departmentsLoading ||
    roomsLoading
  )
    return <>Loading...</>;

  if (
    buildings === undefined ||
    departments === undefined ||
    rooms === undefined 
  )
    return <>Error</>;

  const props = {
    personID,
    sourcePersonID,
    buildings,
    departments,
    rooms,
    permissions
  };

  if (personID !== null)
    return <UserDetailsView {...props} />;
  
  return <EmptyUserDetailsView {...props}/>;
}

type DetailsViewProps = {
  personID: string | null;
  sourcePersonID: string | null;
  buildings: Building[];
  departments: Department[];
  rooms: Room[];
  permissions: number[];
};

function UserDetailsView({ ...props }: DetailsViewProps) {
  const linkTo = useLinkTo();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: userDetails,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["User Details", props.personID],
    queryFn: () => fetchUserDetails(Number(props.personID))
  });

  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
  >({});

  useEffect(
    function syncUserDetails() {
      if (userDetails === undefined) return;
      if (Object.keys(formData).length > 0) return;
      setFormData(userDetails);
    },
    [userDetails, formData]
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  function handleInputChange(
    name: string,
    value: string | string[] | (string | number)[] | number[] | boolean | number
  ) {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

 async function handleSubmit() {
    setError("");  
    const selectedBuildingID = formData.BuildingID as number;
    const associatedRooms = props.rooms.filter((room) => room.BuildingID === selectedBuildingID);

    if (associatedRooms.length === 0) {
      setError("The selected building has no rooms listed. Please select a valid building.");
      return;
    }
  
    let changedFields: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>;
    if (userDetails === undefined) changedFields = formData;
    else changedFields = getChangedFields(userDetails, formData);
    if (Object.keys(changedFields).length === 0) {
      setIsEditing(false);
      return;
    }

    // Package Permissions into an array
    const permissionsArray: number[] = [];
    for (const permissionId of ALL_PERMISSION_IDS) {
      if (formData[`Permission${permissionId}`]) {
        permissionsArray.push(permissionId); // Add permission number to the array if it's selected
      }
    }

    // Update the userDetails object with the new Permissions array
    const userUpdates = {
      ...formData,
      Permissions: permissionsArray, // Replace the Permissions array
    };


    setIsSaving(true);
    const response = await updateUserDetails(Number(props.personID), userUpdates)
    if (response.status === "error")
      setError("An error occurred while updating this user");
    else {
      setIsModalOpen(true);
      setError("");
      setIsEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["personHistory", Number(props.personID)] });
    }
  
    setIsSaving(false);
    
  }

   const formStructure = useMemo(() => buildFormStructure({ ...props, selectedBuildingID: Number(formData["BuildingID"]) }), [props, formData]);
  

   if (isLoading) return <>Loading</>;
   if (isError) return <>Unknown User</>;
  
  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>User Details</h2>
          <p> {formData.FirstName} {formData.LastName} | {formData.WNumber}</p>
        </div>
        {isSaving && <>Saving...</>}
        {error && <span style={{ color: "red" }}>{error}</span>}
        {hasPermission(props.permissions, PermissionId.ADD_EDIT_VIEW_USERS) && !isEditing && <IconButton icon={<Pencil />} variant="secondary" onClick={() => setIsEditing(true)} />}
        {hasPermission(props.permissions, PermissionId.ADD_EDIT_VIEW_USERS) && isEditing && <IconButton icon={<Check />} variant="primary" onClick={handleSubmit} />}
      </div>
      <form className={styles.inputFieldContainer}>
        {formStructure.map((column) => (
          <div key={column.title} className={styles.formColumn}>
            <h3>{column.title}</h3>
            {column.inputs.map((input) => (
              <FormField
                key={input.name}
                input={input}
                value={formData[input.name] || ""}
                onChange={(val) => handleInputChange(input.name, val)}
                disabled={!isEditing}
              />
            ))}
          </div>
        ))}
      </form>
      <div className={styles.Button}>
          {hasPermission(props.permissions, PermissionId.ADD_EDIT_VIEW_USERS) && isEditing &&
            <Button 
              style={{ width: "200px", marginTop: "20px" }} 
              variant={"secondary"} 
              onClick={() => linkTo("Change Password", ["Admin", "Users"], `personID=${props.personID}`)}>
                Change User Password
            </Button>}
      </div>
      <Modal
        isOpen={isModalOpen}
        title="User Updated Successfully"
        onClose={handleModalClose}
        >
        <div className={styles.modalContent}>
            <Button style={{ width: "100px", marginTop: "20px" }} 
              variant={"secondary"} onClick={handleModalClose}>
              OK
            </Button>
        </div>
      </Modal>
      <HistoryChangesSection
        queryScope="personHistory"
        entityId={Number(props.personID)}
        entityTypes={[...PERSON_SYSTEM_NOTE_ENTITY_TYPES]}
        emptyMessage="No History for this user yet"
      />
    </main>
  );
}


function EmptyUserDetailsView({...props }: DetailsViewProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number>
  >({});
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: sourceContactDetails,
    isLoading: isSourceContactLoading
  } = useQuery({
    queryKey: ["Contact Details", props.sourcePersonID],
    queryFn: () => fetchContactDetails(Number(props.sourcePersonID)),
    enabled: props.sourcePersonID !== null
  });

  useEffect(() => {
    if (props.sourcePersonID === null) return;
    if (sourceContactDetails === undefined) return;
    if (Object.keys(formData).length > 0) return;

    setFormData({
      WNumber: sourceContactDetails.WNumber,
      FirstName: sourceContactDetails.FirstName,
      LastName: sourceContactDetails.LastName,
      DepartmentID: sourceContactDetails.DepartmentID ?? [],
      BuildingID: sourceContactDetails.BuildingID ?? "",
      LocationID: sourceContactDetails.LocationID ?? ""
    });
  }, [props.sourcePersonID, sourceContactDetails, formData]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  function handleInputChange(
    name: string,
    value: string | string[] | (string | number)[] | number[] | boolean | number
  ) {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: value,
      };
      // Check password criteria
      const newPassword1 = newFormData.password1 as string;
      const newPassword2 = newFormData.password2 as string;

      if (newPassword1 !== undefined){
        newFormData.sixteenChars = newPassword1.toString().length >= 16;
        newFormData.number = /\d/.test(newPassword1);
        newFormData.uppercase = /[A-Z]/.test(newPassword1);
        newFormData.lowercase = /[a-z]/.test(newPassword1);
      }
      if (newPassword1 !== undefined && newPassword2 !== undefined){
        newFormData.passwordsMatch = newPassword1 === newPassword2;
      }
  
      return newFormData;
    });
  }

  async function handleSubmit() {
    setError("");
    const selectedBuildingID = formData.BuildingID as number;
    const associatedRooms = props.rooms.filter((room) => room.BuildingID === selectedBuildingID);

    if (associatedRooms.length === 0) {
      setError("The selected building has no rooms listed. Please select a valid building.");
      return;
    }
    
    const changedFields = formData;

    if (Object.keys(changedFields).length < 8) {
      setError("Please enter all user details before saving.");
      return;
    }

    const newPassword1 = formData.password1 as string;
    const newPassword2 = formData.password2 as string;
    let validationError = "";
    if (!newPassword1) validationError = "New password is required";
    else if (!newPassword2) validationError = "Re-entry of new password is required";
    else if (newPassword2 !== newPassword1) validationError = "Passwords must match";
    if (validationError !== "") {
      setError(validationError);
      return;
    }

    // Create new salt for new password
    const newSalt = CryptoJS.lib.WordArray.random(10).toString(CryptoJS.enc.Hex);         

    // Package Permissions into an array
    const permissionsArray: number[] = [];
    for (const permissionId of ALL_PERMISSION_IDS) {
      if (formData[`Permission${permissionId}`]) {
        permissionsArray.push(permissionId); // Add permission number to the array if it's selected
      }
    }

    // Update the userDetails object with the new Permissions array and salt
    const newUserDetails = {
      ...formData,
      Permissions: permissionsArray, // Replace the Permissions array
    };

    setIsSaving(true);
    const response =
      props.sourcePersonID === null
        ? await addUserDetails(newSalt, newUserDetails)
        : await promoteContactUserDetails(Number(props.sourcePersonID), newSalt, newUserDetails);
    if (response.status === "error" || !response.status) {
      setError(response.error?.message ?? "An error occurred while adding user");
      setIsEditing(true);
      setIsSaving(false);
      return;
    }
    else {
      await queryClient.invalidateQueries("ContactsList");
      await queryClient.invalidateQueries("UsersList");
      setError("");
      setIsEditing(false);
      setIsModalOpen(true);
    }
    setFormData({});
    setIsEditing(true);
    setIsSaving(false);
  }

  const formStructure = useMemo(() => buildFormStructure({ ...props, selectedBuildingID: Number(formData["BuildingID"]) }), [props, formData]);
  if (isSourceContactLoading) return <>Loading...</>;

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>{props.sourcePersonID === null ? "New User Details" : "Convert Contact to User"}</h2>
        </div>
        {isSaving && <>Saving...</>}
        {error && <span style={{ color: "red" }}>{error}</span>}
        {isEditing && <IconButton icon={<Check />} variant="primary" onClick={handleSubmit} />}
      </div>
      <form className={styles.inputFieldContainer}>
        {formStructure.map((column) => (
          <div key={column.title} className={styles.formColumn}>
            <h3>{column.title}</h3>
            {column.inputs.map((input) => (
              <FormField
                key={input.name}
                input={input}
                value={formData[input.name] || ""}
                onChange={(val) => handleInputChange(input.name, val)}
                disabled={false}
              />
            ))}
          </div>
        ))}
      </form>
      <Modal
        isOpen={isModalOpen}
        title="User Added Successfully"
        onClose={handleModalClose}
        >
        <div className={styles.modalContent}>
            <Button style={{ width: "100px", marginTop: "20px" }} 
              variant={"secondary"} onClick={handleModalClose}>
              OK
            </Button>
        </div>
      </Modal>
    </main>
  );
}

function FormField({
  input,
  value,
  onChange,
  disabled
}: {
  input: UserInputField;
  value: string | string[] | (string | number)[] | number[] | boolean | number;
  onChange: (val: string | string[] | (string | number)[] | number[] | boolean | number) => void;
  disabled: boolean;
}) {
  const [options, setOptions] = useState<{ label: string; value: string | number }[]>([]);

  useEffect(() => {
    if (input.fetchOptions) {
      setOptions(input.fetchOptions());
    }
  }, [input]);

  return (
    <div className={styles.formField}>
      {input.inputType !== "checkbox" && (<label>{input.label}</label>)}

      {input.inputType === "input" && (
        <LabelInput
          type={input.name.includes("password") ? "password" : "text"}
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      )}

      {input.inputType === "textarea" && (
        <TextArea value={typeof value === "string" ? value : ""} onChange={(val) => onChange(val)} disabled={disabled} />
      )}

      {input.inputType === "checkbox" && (
        <Checkbox 
          checked={Boolean(value)} 
          label={input.label} 
          onChange={(val) => onChange(val)} 
          disabled={disabled}
        />
        )}

      {input.inputType === "single select" && (
        <SingleSelect
          options={options}
          value={typeof value === "boolean" ? undefined : (value as string)}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      )}

      {input.inputType === "multi select" && (
        <MultiSelect
          options={options}
          values={Array.isArray(value) ? Array.from(new Set(value)) : []}
          onChange={(selectedValues) => onChange(selectedValues)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function getChangedFields(
  original: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>,
  updated: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const changedFields: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null> =
    {};

  for (const key in updated) {
    if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
      changedFields[key] = updated[key];
    }
  }

  return changedFields;
}

type InputType = "input" | "textarea" | "checkbox" | "single select" | "multi select";

type UserInputField = {
  name: string; // Unique identifier for form handling
  label: string;
  inputType: InputType;
  fetchOptions?: () => { value: string | number; label: string }[]; // Only used for select inputs
};

type Column = {
  title: string;
  inputs: UserInputField[];
};

function buildFormStructure(details: DetailsViewProps & { selectedBuildingID?: number } ): Column[] {
  const formStructure: Column[] = [
    {
      title: "User Info",
      inputs: [
        { name: "FirstName", label: "First Name*", inputType: "input" },
        { name: "LastName", label: "Last Name*", inputType: "input" },
        { name: "WNumber", label: "W Number*", inputType: "input" },
        {
          name: "DepartmentID",
          label: "Departments*",
          inputType: "multi select",
          fetchOptions: () => details.departments.filter(isListOptionActive).map((department) => ({ label: department.Name, value: department.DepartmentID }))
        },
        {
          name: "BuildingID",
          label: "Building*",
          inputType: "single select",
          fetchOptions: () =>
            details.buildings.filter(isListOptionActive).map((building) => ({ label: building.Name, value: building.BuildingID }))
        },
        {
          name: "LocationID",
          label: "Room Number*",
          inputType: "single select",
          fetchOptions: () =>
            details.rooms
              .filter(isListOptionActive)
              .filter((room) => room.BuildingID === details.selectedBuildingID)
              .map((room) => ({ label: room.RoomNumber, value: room.LocationID }))
        },
      ]
    },
  ];

  if (hasPermission(details.permissions, PermissionId.SET_USER_PERMISSIONS)) {
    formStructure.push({
      title: "Permissions",
      inputs: [
        { name: "Permission1", label: PERMISSION_DISPLAY_NAMES[PermissionId.ADD_EDIT_ASSETS], inputType: "checkbox" },
        { name: "Permission2", label: PERMISSION_DISPLAY_NAMES[PermissionId.ARCHIVE_ASSETS], inputType: "checkbox" },
        { name: "Permission3", label: PERMISSION_DISPLAY_NAMES[PermissionId.IMPORT_CSV_DATA], inputType: "checkbox" },
        { name: "Permission4", label: PERMISSION_DISPLAY_NAMES[PermissionId.ADD_EDIT_CONTACT_PERSONS], inputType: "checkbox" },
        { name: "Permission5", label: PERMISSION_DISPLAY_NAMES[PermissionId.ADD_EDIT_LIST_OPTIONS], inputType: "checkbox" },
        { name: "Permission6", label: PERMISSION_DISPLAY_NAMES[PermissionId.ADD_EDIT_VIEW_USERS], inputType: "checkbox" },
        { name: "Permission7", label: PERMISSION_DISPLAY_NAMES[PermissionId.SET_USER_PERMISSIONS], inputType: "checkbox" },
      ]
    });
  }

  if (details.personID === null || details.personID === "") {
    formStructure.push(
      {
      title: "Password",
      inputs: [
        { name: "password1", label: "New Password*", inputType: "input" },
        { name: "password2", label: "Confirm New Password*", inputType: "input" },
        { name: "passwordsMatch", label: "Passwords Match", inputType: "checkbox" },
        { name: "sixteenChars", label: "16 Characters", inputType: "checkbox" },
        { name: "number", label: "One Number", inputType: "checkbox" },
        { name: "uppercase", label: "One Uppercase Letter", inputType: "checkbox" },
        { name: "lowercase", label: "One Lowercase Letter", inputType: "checkbox" },
      ]
    });
  }

  return formStructure; 
}

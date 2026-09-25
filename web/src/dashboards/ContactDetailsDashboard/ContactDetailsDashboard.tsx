import { Check, Pencil } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router";
import { Building, Department, Room } from "../../../../@types/data";
import { addContactDetails, fetchContactDetails, updateContactDetails } from "../../api/contacts";
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
import styles from "./ContactDetailsDashboard.module.css";


export function ContactDetailsDashboard() {
  const [searchParams] = useSearchParams();
  const personID = useMemo(() => searchParams.get("personID"), [searchParams]);
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: rooms, isLoading: roomsLoading } = useRooms();

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
    buildings,
    departments,
    rooms
  };

  if (personID !== null)
    return <ContactDetailsView {...props} />;

  return <EmptyContactDetailsView {...props}/>;
}

type DetailsViewProps = {
  personID: string | null;
  buildings: Building[];
  departments: Department[];
  rooms: Room[];
};

function ContactDetailsView({...props }: DetailsViewProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
 
  const {
    data: contactDetails,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["Contact Details", props.personID],
    queryFn: () => fetchContactDetails(Number(props.personID))
  });

  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
  >({});

  useEffect(
    function syncContactDetails() {
      if (contactDetails === undefined) return;
      if (Object.keys(formData).length > 0) return;
      setFormData(contactDetails);
    },
    [contactDetails, formData]
  );

  function handleInputChange(
    name: string,
    value: string | string[] | (string | number)[] | number[] | boolean | number
  ) {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  async function handleSubmit() {
    setError("");
    const selectedBuildingID = formData.BuildingID as number;
    const associatedRooms = props.rooms.filter((room) => room.BuildingID === selectedBuildingID);

    if (associatedRooms.length === 0) {
      setError("The selected building has no rooms listed. Please select a valid building.");
      return;
    }
    
    let changedFields: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>;
    if (contactDetails === undefined) changedFields = formData;
    else changedFields = getChangedFields(contactDetails, formData);
    if (Object.keys(changedFields).length === 0) {
      setIsEditing(false);
      return;
    }
    
    // Sanitize fields to ensure no null values
  const sanitizedFields = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [key, value ?? ""])
  );
  
  const WNumber = sanitizedFields.WNumber as string;
  const FirstName = sanitizedFields.FirstName as string;
  const LastName = sanitizedFields.LastName as string;
  const DepartmentID = sanitizedFields.DepartmentID as number[];
  const BuildingID = sanitizedFields.BuildingID as number;
  const LocationID = sanitizedFields.LocationID as number;
    
  setIsSaving(true);
  const response = await updateContactDetails(props.personID ?? "", WNumber, FirstName, LastName, DepartmentID, BuildingID, LocationID)

  if (response.status === "error")
    setError("An error occurred while updating this contact");
  else {
    setIsModalOpen(true);
    // alert("Contact Updated Successfully");
    setError("");
    setIsEditing(false);
    void queryClient.invalidateQueries({ queryKey: ["personHistory", Number(props.personID)] });
  }

  setIsSaving(false);
  }

  const formStructure = useMemo(() => buildFormStructure({ ...props, selectedBuildingID: Number(formData["BuildingID"]) }), [props, formData]);
  
  if (isLoading) return <>Loading</>;
  if (isError) return <>Unknown Contact</>;

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>Contact Details</h2>
          <p> {formData.FirstName} {formData.LastName} | {formData.WNumber}</p>
        </div>
        {isSaving && <>Saving...</>}
        {error && <span style={{ color: "red" }}>{error}</span>}
        {!isEditing && <IconButton icon={<Pencil />} variant="secondary" onClick={() => setIsEditing(true)} />}
        {isEditing && <IconButton icon={<Check />} variant="primary" onClick={handleSubmit} />} 
      </div>
      <form className={styles.inputFieldContainer} onSubmit={handleSubmit}>
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
      <Modal
        isOpen={isModalOpen}
        title="Contact Updated Successfully"
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
        emptyMessage="No History for this contact yet"
      />
    </main>
  );
}

function EmptyContactDetailsView({...props }: DetailsViewProps) {
  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number>
  >({});

  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleInputChange(
    name: string,
    value: string | string[] | (string | number)[] | number[] | boolean | number
  ) {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  async function handleSubmit() {
    const selectedBuildingID = formData.BuildingID as number;
    const associatedRooms = props.rooms.filter((room) => room.BuildingID === selectedBuildingID);

    if (associatedRooms.length === 0) {
      setError("The selected building has no rooms listed. Please select a valid building.");
      return;
    }
    
    const changedFields = formData;
    
    if (Object.keys(changedFields).length < 6) {
      setError("Please enter all contact details before saving.")
      return;
    }
    
    // Sanitize fields to ensure no null values
    const sanitizedFields = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value ?? ""])
    );
    
    const WNumber = sanitizedFields.WNumber as string;
    const FirstName = sanitizedFields.FirstName as string;
    const LastName = sanitizedFields.LastName as string;
    const DepartmentID = sanitizedFields.DepartmentID as number[];
    const BuildingID = sanitizedFields.BuildingID as number;
    const LocationID = sanitizedFields.LocationID as number;
      
    setIsSaving(true);
    const response = await addContactDetails(WNumber, FirstName, LastName, DepartmentID, BuildingID, LocationID)
    if (response.status === "error")
      setError("An error occurred while adding this contact");
    else {
      // alert("Contact Added Successfully");
      setIsModalOpen(true);
      setError("");
      setIsEditing(false);
      // Clear the form data
    }
    setFormData({});
    setIsEditing(true);
    setIsSaving(false);
  }
  
  const formStructure = useMemo(() => buildFormStructure({ ...props, selectedBuildingID: Number(formData["BuildingID"]) }), [props, formData]);

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>New Contact Details</h2>
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
        title="Contact Added Successfully"
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
  input: ContactInputField;
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
    values={Array.isArray(value) ? value : []}
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

type ContactInputField = {
  name: string; // Unique identifier for form handling
  label: string;
  inputType: InputType;
  fetchOptions?: () => { value: string | number; label: string }[]; // Only used for select inputs
};

type Column = {
  title: string;
  inputs: ContactInputField[];
};

function buildFormStructure(details: DetailsViewProps & { selectedBuildingID?: number }): Column[] {
  const formStructure: Column[] = [
    {
      title: "Contact Person Info",
      inputs: [
        { name: "FirstName", label: "First Name*", inputType: "input" },
        { name: "LastName", label: "Last Name*", inputType: "input" },
        { name: "WNumber", label: "W Number*", inputType: "input" },
        {
          name: "DepartmentID",
          label: "Department*",
          inputType: "multi select",
          fetchOptions: () => details.departments.filter(isListOptionActive).map((department) => ({ label: department.Name, value: department.DepartmentID }))
        },
        {
          name: "BuildingID",
          label: "Building*",
          inputType: "single select",
          fetchOptions: () => details.buildings.filter(isListOptionActive).map((building) => ({ label: building.Name, value: building.BuildingID }))
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
  return formStructure;
}

export default ContactDetailsDashboard;
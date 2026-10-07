import { ArrowLeft, ArrowRight, Barcode, Check, Pencil, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useNavigate, useSearchParams } from "react-router";
import {
  AssetClass,
  AssetDetails,
  Building,
  Condition,
  ContactOverview,
  Department,
  DeviceType,
  FiscalYear,
  Note,
  Room
} from "../../../../@types/data";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { addNewNote, fetchAssetDetails, fetchAssetIdByTagNumber, fetchAssetNotes, updateAssetDetails } from "../../api/assets";
import { HistoryChangesSection } from "../../components/HistoryChangesSection/HistoryChangesSection";
import { Notes } from "../../components/Notes/Notes";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { LabelInput } from "../../elements/LabelInput/LabelInput";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { TextArea } from "../../elements/TextArea/TextArea";
import {
  useAssetClasses,
  useAssetContactPersons,
  useBuildings,
  useConditions,
  useDepartments,
  useDeviceTypes,
  useFiscalYears,
  useRooms
} from "../../hooks/optionHooks";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import styles from "./AssetsDetailsDashboard.module.css";

export function AssetsDetailsDashboard() {
  const [tagNumber, setTagNumber] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isResolvingTag, setIsResolvingTag] = useState(false);
  const linkTo = useLinkTo();
  const [searchParams] = useSearchParams();
  const assetIdParam = useMemo(() => searchParams.get("assetId"), [searchParams]);
  const parsedAssetId = Number(assetIdParam);
  const hasAssetIdParam = assetIdParam !== null;
  const hasValidAssetIdParam = hasAssetIdParam && Number.isInteger(parsedAssetId) && parsedAssetId > 0;

  const {
    data: assetDetails,
    isLoading: assetDetailsLoading,
    isError: assetDetailsError,
    error: assetDetailsQueryError
  } = useQuery({
    queryKey: ["Asset Details", parsedAssetId],
    queryFn: () => fetchAssetDetails(parsedAssetId),
    enabled: hasValidAssetIdParam,
    retry: false,
    refetchOnWindowFocus: false
  });

  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: contactPersons, isLoading: contactPersonsLoading } = useAssetContactPersons();
  const { data: conditions, isLoading: conditionsLoading } = useConditions();
  const { data: deviceTypes, isLoading: deviceTypesLoading } = useDeviceTypes();
  const { data: fiscalYears, isLoading: fiscalYearsLoading } = useFiscalYears();
  const { data: assetClasses, isLoading: assetClassesLoading } = useAssetClasses();

  useEffect(() => {
    if (assetDetails?.TagNumber === undefined) return;
    setTagNumber(assetDetails.TagNumber);
  }, [assetDetails?.TagNumber]);

  useEffect(() => {
    if (!hasAssetIdParam || hasValidAssetIdParam) return;
    setLookupError("Invalid asset ID");
    linkTo("Asset Details", ["Assets"]);
  }, [hasAssetIdParam, hasValidAssetIdParam, linkTo]);

  useEffect(() => {
    if (!hasAssetIdParam || !assetDetailsError) return;
    const message = assetDetailsQueryError instanceof Error ? assetDetailsQueryError.message : "Unable to load asset";
    setLookupError(message);
    linkTo("Asset Details", ["Assets"]);
  }, [assetDetailsError, assetDetailsQueryError, hasAssetIdParam, linkTo]);

  async function handleLookupByTag() {
    const trimmedTag = tagNumber.trim();
    if (trimmedTag === "") {
      setLookupError("Enter a tag number");
      return;
    }

    setIsResolvingTag(true);
    setLookupError("");

    try {
      const foundAssetId = await fetchAssetIdByTagNumber(trimmedTag);
      linkTo("Asset Details", ["Assets"], `assetId=${foundAssetId}`);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Unable to find asset");
    } finally {
      setIsResolvingTag(false);
    }
  }

  const requestError = hasAssetIdParam && !hasValidAssetIdParam ? "Invalid asset ID" : "";
  const fetchError =
    assetDetailsError && assetDetailsQueryError instanceof Error ? assetDetailsQueryError.message : "";
  const errorMessage = lookupError || requestError || fetchError;

  const lookupPanel = (
    <div className={styles.lookupContainer}>
      <h2>Find Asset By Tag Number</h2>
      <div className={styles.tagInput}>
        <IconInput
          placeholder="Enter tag number"
          icon={<Barcode />}
          width="100%"
          value={tagNumber}
          onChange={(value) => {
            setTagNumber(value);
            if (lookupError !== "") setLookupError("");
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLookupByTag();
            }
          }}
          autoFocus={!hasAssetIdParam}
        />
        <IconButton
          icon={<ArrowRight />}
          onClick={handleLookupByTag}
          variant="primary"
          disabled={tagNumber.trim() === "" || isResolvingTag}
        />
      </div>
      {isResolvingTag && <div>Searching...</div>}
      {errorMessage !== "" && <div className={styles.errorMessage}>{errorMessage}</div>}
    </div>
  );

  if (!hasAssetIdParam) {
    return (
      <main className={styles.noTagLayout}>
        {lookupPanel}
      </main>
    );
  }

  if (
    assetDetailsLoading ||
    buildingsLoading ||
    roomsLoading ||
    departmentsLoading ||
    contactPersonsLoading ||
    conditionsLoading ||
    deviceTypesLoading ||
    fiscalYearsLoading ||
    assetClassesLoading
  )
    return (
      <main className={styles.noTagLayout}>
        {lookupPanel}
      </main>
    );

  if (
    assetDetails === undefined ||
    buildings === undefined ||
    rooms === undefined ||
    departments === undefined ||
    contactPersons === undefined ||
    conditions === undefined ||
    deviceTypes === undefined ||
    fiscalYears === undefined ||
    assetClasses === undefined
  )
    return (
      <main className={styles.noTagLayout}>
        {lookupPanel}
      </main>
    );

  const props = {
    assetId: parsedAssetId,
    assetDetails,
    buildings,
    rooms,
    departments,
    contactPersons,
    conditions,
    deviceTypes,
    fiscalYears,
    assetClasses
  };
  return <AssetDetailsView {...props} />;
}

type DetailsViewProps = {
  assetId: number;
  assetDetails: AssetDetails;
  buildings: Building[];
  rooms: Room[];
  departments: Department[];
  contactPersons: ContactOverview[];
  conditions: Condition[];
  deviceTypes: DeviceType[];
  fiscalYears: FiscalYear[];
  assetClasses: AssetClass[];
};

function AssetDetailsView({ assetId, assetDetails, ...props }: DetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const { data: notes = [], refetch: refetchNotes } = useQuery<Note[]>({
    queryKey: ["Notes", assetId],
    queryFn: () => fetchAssetNotes(assetId)
  });
  const { permissions } = useAuth();
  const linkTo = useLinkTo();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
  >({});

  useEffect(
    function syncAssetDetailsIntoForm() {
      setFormData(assetDetails);
      setIsEditing(false);
      setError("");
    },
    [assetDetails]
  );

  function handleInputChange(
    name: string,
    value: string | string[] | (string | number)[] | number[] | boolean | number | null
  ) {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit() {
    let changedFields: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>;
    changedFields = getChangedFields(assetDetails, formData);
    if (Object.keys(changedFields).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    if (!(await updateAssetDetails(assetId, changedFields)))
      setError("An error occurred while updating this asset");
    else {
      setError("");
      setIsEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["assetHistory", assetId] });
    }

    setIsSaving(false);
  }

  function handleCancelEdit() {
    setError("");
    setFormData(assetDetails);
    setIsEditing(false);
  }

  async function handleAddNote(note: string) {
    await addNewNote(assetId, note);
    refetchNotes();
  }

  const formStructure = useMemo(
    () =>
      buildFormStructure({
        ...props,
        selectedBuildingID: Number(formData["BuildingID"]),
        selectedContactPersonID: Number(formData["ContactPersonID"]),
        selectedContactPersonLabel: getSelectedContactPersonLabel(formData)
      }),
    [props, formData]
  );

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>Asset Details</h2>
          <p>#{assetId}</p>
        </div>
        <div className={styles.headerActions}>
          {isSaving && <span>Saving...</span>}
          {error && <span style={{ color: "red" }}>{error}</span>}
          {hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS) && !isEditing && (
            <div className={styles.assetActions}>
              <IconButton 
                icon={<ArrowLeft />} 
                variant="secondary" 
                onClick={() => {
                  const canGoBack = typeof window !== "undefined" && window.history.length > 1;
                  if (canGoBack) navigate(-1);
                  else linkTo("Asset Details", ["Assets"]);
                }}
              />
              <IconButton icon={<Pencil />} variant="secondary" onClick={() => setIsEditing(true)} />
            </div>
          )}
          {hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS) && isEditing && (
            <div className={styles.editActions}>
              <IconButton icon={<X />} variant="secondary" onClick={handleCancelEdit} disabled={isSaving} />
              <IconButton icon={<Check />} variant="primary" onClick={handleSubmit} disabled={isSaving} />
            </div>
          )}
        </div>
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
      <Notes notes={notes.map((note) => note.Note)} onAdd={handleAddNote} />
      <HistoryChangesSection
        queryScope="assetHistory"
        entityId={assetId}
        entityTypes={["Equipment"]}
        emptyMessage="No History for this asset yet"
      />
    </main>
  );
}

function FormField({
  input,
  value,
  onChange,
  disabled
}: {
  input: AssetInputField;
  value: string | string[] | (string | number)[] | number[] | boolean | number | null;
  onChange: (val: string | string[] | (string | number)[] | number[] | boolean | number | null) => void;
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
      <label>{input.label}</label>

      {input.inputType === "input" && (
        <LabelInput
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(val) => onChange(typeof value === "string" ? val : Number(val))}
          disabled={disabled}
        />
      )}

      {input.inputType === "textarea" && (
        <TextArea
          value={typeof value === "string" ? value : ""}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      )}

      {input.inputType === "checkbox" && (
        <Checkbox checked={Boolean(value)} onChange={(val) => onChange(val ? 1 : 0)} disabled={disabled} />
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

type AssetInputField = {
  name: string; // Unique identifier for form handling
  label: string;
  inputType: InputType;
  fetchOptions?: () => { value: string | number; label: string }[];
};

type Column = {
  title: string;
  inputs: AssetInputField[];
};

type FormStructureDetails = {
  buildings: Building[];
  rooms: Room[];
  departments: Department[];
  contactPersons: ContactOverview[];
  conditions: Condition[];
  deviceTypes: DeviceType[];
  fiscalYears: FiscalYear[];
  assetClasses: AssetClass[];
  selectedBuildingID?: number;
  selectedContactPersonID?: number;
  selectedContactPersonLabel?: string;
};

function buildFormStructure(details: FormStructureDetails) {
  const formStructure: Column[] = [
    {
      title: "Basic Info",
      inputs: [
        { name: "TagNumber", label: "Tag Number", inputType: "input" },
        { name: "SecondaryNumber", label: "Secondary Number", inputType: "input" },
        { name: "Description", label: "Description", inputType: "textarea" },
        {
          name: "DepartmentID",
          label: "Department",
          inputType: "single select",
          fetchOptions: () =>
            details.departments.filter(isListOptionActive).map((department) => ({ label: department.Name, value: department.DepartmentID }))
        },
        {
          name: "BuildingID",
          label: "Building",
          inputType: "single select",
          fetchOptions: () =>
            details.buildings.filter(isListOptionActive).map((building) => ({ label: building.Name, value: building.BuildingID }))
        },
        {
          name: "LocationID",
          label: "Room",
          inputType: "single select",
          fetchOptions: () =>
            details.rooms
              .filter(isListOptionActive)
              .filter((room) => room.BuildingID === details.selectedBuildingID)
              .map((room) => ({ label: room.RoomNumber, value: room.LocationID }))
        },
        {
          name: "ContactPersonID",
          label: "Contact Person",
          inputType: "single select",
          fetchOptions: () =>
            buildContactPersonOptions(
              details.contactPersons,
              details.selectedContactPersonID,
              details.selectedContactPersonLabel
            )
        }
      ]
    },
    {
      title: "Device Details",
      inputs: [
        {
          name: "DeviceTypeID",
          label: "Device Type",
          inputType: "single select",
          fetchOptions: () => details.deviceTypes.filter(isListOptionActive).map((type) => ({ label: type.Name, value: type.DeviceTypeID }))
        },
        {
          name: "AssetClassID",
          label: "Asset Class",
          inputType: "single select",
          fetchOptions: () => details.assetClasses.filter(isListOptionActive).map((type) => ({ label: type.Name, value: type.AssetClassID }))
        },
        { name: "SerialNumber", label: "Serial Number", inputType: "input" },
        {
          name: "ConditionID",
          label: "Condition",
          inputType: "single select",
          fetchOptions: () =>
            details.conditions.filter(isListOptionActive).map((condition) => ({ label: condition.ConditionName, value: condition.ConditionID }))
        },
        { name: "Manufacturer", label: "Manufacturer", inputType: "input" },
        { name: "PartNumber", label: "Part Number", inputType: "input" },
        { name: "Rapid7", label: "Rapid 7", inputType: "checkbox" },
        { name: "CrowdStrike", label: "CrowdStrike", inputType: "checkbox" }
      ]
    },
    {
      title: "Accounting Info",
      inputs: [
        { name: "AccountingDate", label: "Accounting Date", inputType: "input" },
        { name: "AccountCost", label: "Account Cost", inputType: "input" },
        { name: "PONumber", label: "PO Number", inputType: "input" },
        {
          name: "FiscalYearID",
          label: "Replacement Fiscal Year",
          inputType: "single select",
          fetchOptions: () => details.fiscalYears.map((year) => ({ label: year.Year, value: year.ReplacementID }))
        }
      ]
    }
  ];

  return formStructure;
}

function getSelectedContactPersonLabel(
  formData: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const firstName = typeof formData.ContactPersonFirstName === "string" ? formData.ContactPersonFirstName.trim() : "";
  const lastName = typeof formData.ContactPersonLastName === "string" ? formData.ContactPersonLastName.trim() : "";
  const fullName = [firstName, lastName].filter((value) => value !== "").join(" ").trim();
  return fullName === "" ? undefined : fullName;
}

function buildContactPersonOptions(
  contactPersons: ContactOverview[],
  selectedContactPersonID?: number,
  selectedContactPersonLabel?: string
) {
  const options = contactPersons.map((person) => ({ label: person.FullName, value: person.PersonID }));
  const selectedId = selectedContactPersonID ?? 0;

  if (selectedId > 0 && !options.some((option) => Number(option.value) === selectedId)) {
    options.unshift({
      label:
        selectedContactPersonLabel !== undefined && selectedContactPersonLabel.trim() !== ""
          ? `${selectedContactPersonLabel} (inactive)`
          : `Person #${selectedId} (inactive)`,
      value: selectedId
    });
  }

  return options;
}

export default AssetsDetailsDashboard;

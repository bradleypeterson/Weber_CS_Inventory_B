import { ArrowLeft, Check } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AssetClass,
  Building,
  Condition,
  ContactOverview,
  Department,
  DeviceType,
  FiscalYear,
  Room
} from "../../../../@types/data";
import { addAsset } from "../../api/assets";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { IconButton } from "../../elements/IconButton/IconButton";
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
import { useLinkTo } from "../../navigation/useLinkTo";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import styles from "./AssetsAddDashboard.module.css";

const ADD_ASSET_REQUIRED_FIELDS = [
  "TagNumber",
  "BuildingID",
  "LocationID",
  "DepartmentID",
  "AssetClassID",
  "DeviceTypeID",
  "ConditionID"
] as const;

const ADD_ASSET_REQUIRED_FIELD_SET = new Set<string>(ADD_ASSET_REQUIRED_FIELDS);

export function AssetsAddDashboard() {
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: contactPersons, isLoading: contactPersonsLoading } = useAssetContactPersons();
  const { data: conditions, isLoading: conditionsLoading } = useConditions();
  const { data: deviceTypes, isLoading: deviceTypesLoading } = useDeviceTypes();
  const { data: fiscalYears, isLoading: fiscalYearsLoading } = useFiscalYears();
  const { data: assetClasses, isLoading: assetClassesLoading } = useAssetClasses();

  if (
    buildingsLoading ||
    roomsLoading ||
    departmentsLoading ||
    contactPersonsLoading ||
    conditionsLoading ||
    deviceTypesLoading ||
    fiscalYearsLoading ||
    assetClassesLoading
  )
    return <>Loading...</>;

  if (
    buildings === undefined ||
    rooms === undefined ||
    departments === undefined ||
    contactPersons === undefined ||
    conditions === undefined ||
    deviceTypes === undefined ||
    fiscalYears === undefined ||
    assetClasses === undefined
  )
    return <>Error</>;

  const props = {
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
  buildings: Building[];
  rooms: Room[];
  departments: Department[];
  contactPersons: ContactOverview[];
  conditions: Condition[];
  deviceTypes: DeviceType[];
  fiscalYears: FiscalYear[];
  assetClasses: AssetClass[];
};

function AssetDetailsView(props: DetailsViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const navigate = useNavigate();
  const linkTo = useLinkTo();

  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
  >({});

  function handleInputChange(
    name: string,
    value: string | string[] | (string | number)[] | number[] | boolean | number | null
  ) {
    if (statusMessage !== null) setStatusMessage(null);
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleReturn() {
    const canGoBack = typeof window !== "undefined" && window.history.length > 1;
    if (canGoBack) navigate(-1);
    else linkTo("Search", ["Assets"]);
  }

  async function handleSubmit() {
    try {
      setIsSaving(true);
      setStatusMessage(null);
      const response = await addAsset(formData);
      if (response.status === "error") {
        setStatusMessage({ type: "error", message: response.error.message });
      } else {
        setFormData({});
        setStatusMessage({ type: "success", message: "Asset added successfully." });
      }
    } catch (e) {
      setStatusMessage({ type: "error", message: "An unknown error occurred while adding the asset" });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  const saveDisabled = useMemo(
    () => isSaving || !ADD_ASSET_REQUIRED_FIELDS.every((field) => isRequiredFieldPopulated(formData[field])),
    [formData, isSaving]
  );

  const formStructure = useMemo(
    () =>
      buildFormStructure({
        ...props,
        selectedBuildingID: Number(formData["BuildingID"]),
        selectedContactPersonID: Number(formData["ContactPersonID"])
      }),
    [props, formData]
  );

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>Add Asset</h2>
        </div>
        <div className={styles.headerActions}>
          {isSaving && <span>Saving...</span>}
          {statusMessage && (
            <span className={statusMessage.type === "error" ? styles.statusError : styles.statusSuccess}>
              {statusMessage.message}
            </span>
          )}
          <div className={styles.assetActions}>
            <IconButton icon={<ArrowLeft />} variant="secondary" onClick={handleReturn} disabled={isSaving} />
            <IconButton icon={<Check />} variant="primary" onClick={handleSubmit} disabled={saveDisabled} />
          </div>
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
                disabled={isSaving}
              />
            ))}
          </div>
        ))}
      </form>
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
      <label>
        {input.label}
        {input.required ? " *" : ""}
      </label>

      {input.inputType === "input" && (
        <LabelInput
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(val) => onChange(input.parse ? input.parse(val) : val)}
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

type InputType = "input" | "textarea" | "checkbox" | "single select" | "multi select";

type AssetInputField = {
  name: string; // Unique identifier for form handling
  label: string;
  inputType: InputType;
  required?: boolean;
  fetchOptions?: () => { value: string | number; label: string }[];
  parse?: (raw: string) => string | number | null;
};

type Column = {
  title: string;
  inputs: AssetInputField[];
};

function buildFormStructure(
  details: DetailsViewProps & {
    selectedBuildingID?: number;
    selectedContactPersonID?: number;
    selectedContactPersonLabel?: string;
  }
) {
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
        { 
          name: "AccountCost",
          label: "Account Cost",
          inputType: "input",
          parse: (raw) => (raw.trim() === "" ? null : Number(raw))
        },
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

  return formStructure.map((column) => ({
    ...column,
    inputs: column.inputs.map((input) => ({
      ...input,
      required: ADD_ASSET_REQUIRED_FIELD_SET.has(input.name)
    }))
  }));
}

function isRequiredFieldPopulated(
  value: string | string[] | (string | number)[] | number[] | boolean | number | null | undefined
) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value === true;
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

import CryptoJS from "crypto-js";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router";
import { updatePassword } from "../../api/auth";
import { fetchUserDetails } from "../../api/users";
import { Button } from "../../elements/Button/Button";
import { Checkbox } from "../../elements/Checkbox/Checkbox";
import { LabelInput } from "../../elements/LabelInput/LabelInput";
import { Modal } from "../../elements/Modal/Modal";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { TextArea } from "../../elements/TextArea/TextArea";
import { useAuth } from "../../hooks/useAuth";
import styles from "./PasswordChangeDashboard.module.css";

type UserProps = {
  personID: string;
  userID: string;
  WNumber: string;
  Name: string;
  selfChange: boolean;
};

export function PasswordChangeDashboard() {
  const [searchParams] = useSearchParams();
  const passedID = useMemo(() => searchParams.get("personID"), [searchParams]); 
  const loggedInPersonID = Number(useAuth().personID);
  let personID = ""; 
  let selfChange = false;
  if (!passedID || passedID === "undefined") {
    selfChange = true;
    personID = loggedInPersonID.toString();
  }
  else { personID = passedID.toString(); }
  
  
  const {data: userDetails, isLoading, isError} = useQuery({
    queryKey: ["User Details", personID],
    queryFn: () => fetchUserDetails(Number(personID))
  });
 
  const WNumber = userDetails?.WNumber ?? "";
  const Name = userDetails?.Name ?? "";
  const userID = userDetails?.UserID.toString() ?? "";

  const props: UserProps = {
    personID: personID,
    userID: userID,
    WNumber: WNumber,
    Name: Name,
    selfChange: selfChange,
  };

  if (isLoading) return <>Loading</>;
  if (isError) return <>Unknown User</>;

  if (personID)
    return <PasswordChangeView {...props}/>;
  return null;
}

function PasswordChangeView({ ...props }: UserProps) {
  const [formData, setFormData] = useState<
    Record<string, string | string[] | (string | number)[] | number[] | boolean | number>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const newPassword1 = newFormData.newPassword1 as string;
      const newPassword2 = newFormData.newPassword2 as string;
  
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
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  async function handleSubmit() {
    setIsSaving(true);
    const newErrors: Record<string, string> = {};
    if (!formData.oldPassword && props.selfChange) {
      newErrors.oldPassword = "Old password is required";
    }
    if (!formData.newPassword1) {
      newErrors.newPassword1 = "New password is required";
    }
    if (!formData.newPassword2) {
      newErrors.newPassword2 = "Re-entry of new password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSaving(false);
      return;
    }

    try {
      // Create new salt
      const newSalt = CryptoJS.lib.WordArray.random(10).toString(CryptoJS.enc.Hex);
      // password change type
      let updateType = "admin";
      let oldPassword = "";
      if (props.selfChange) {
          updateType = "personal";
          oldPassword = formData.oldPassword.toString();
      }

      // Call function to update password
      setIsSaving(true);
      const response = await updatePassword(props.userID.toString(), oldPassword, formData.newPassword1.toString(), newSalt, updateType);
      setIsSaving(false);

      if (response?.status !== "error") {
        setIsModalOpen(true);
        //alert("Password Changed Successfully");
        setErrors({}); // Clear errors after success
        setFormData({}); // Clear form data
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordChangeError: "Password change failed",
        }));
        return;
      }
    } catch (error) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        passwordChangeError: "Password change failed",
      }));
      console.error("Password change failed:", error);
    }
    setIsSaving(false);
  }

  const formStructure = useMemo(() => buildFormStructure({ ...props }), [props]);

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <div>
          <h2>Change Password</h2>
          <p>
            {props.Name} | {props.WNumber}
          </p>
        </div>
      </div>
      {isSaving && <>Saving...</>}
      {Object.keys(errors).length > 0 && (
        <div style={{ color: "red" }}>
          {Object.keys(errors).map((key) => (
            <div key={key}>{errors[key]}</div>
          ))}
        </div>
      )}
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
              />
            ))}
          </div>
        ))}
      </form>
      <div className={styles.Button}>
          <Button style={{ width: "200px", display: "flex", marginTop: "5px" }} onClick={handleSubmit} variant={"secondary"} type="submit" disabled={isSaving}>
            Change Password
          </Button>
        </div>
        <Modal
        isOpen={isModalOpen}
        title="Password Changed Successfully"
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
  onChange
}: {
  input: UserInputField;
  value: string | string[] | (string | number)[] | number[] | boolean | number;
  onChange: (val: string | string[] | (string | number)[] | number[] | boolean | number) => void;
}) {
  const [options, setOptions] = useState<{ label: string; value: string | number }[]>([]);

  useEffect(() => {
    if (input.fetchOptions) {
      input.fetchOptions().then(setOptions);
    }
  }, [input]);

  return (
    <div className={styles.formField}>
      {input.inputType !== "checkbox" && (<label>{input.label}</label>)}

      {input.inputType === "input" && (
        <LabelInput
          type={input.name.includes("Password") ? "password" : "text"}
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(val) => onChange(val)}
        />
      )}

      {input.inputType === "textarea" && (
        <TextArea value={typeof value === "string" ? value : ""} onChange={(val) => onChange(val)} />
      )}

      {input.inputType === "checkbox" && <Checkbox checked={Boolean(value)} label={input.label} onChange={(val) => onChange(val)} />}

      {input.inputType === "single select" && (
        <SingleSelect
          options={options}
          value={typeof value === "boolean" ? undefined : (value as string)}
          onChange={(val) => onChange(val)}
        />
      )}

      {input.inputType === "multi select" && (
        <MultiSelect
          options={options}
          values={Array.isArray(value) ? value : []}
          onChange={(selectedValues) => onChange(selectedValues)}
        />
      )}
    </div>
  );
}

type InputType = "input" | "textarea" | "checkbox" | "single select" | "multi select";

type UserInputField = {
  name: string; // Unique identifier for form handling
  label: string;
  inputType: InputType;
  fetchOptions?: () => Promise<{ value: string | number; label: string }[]>; // Only used for select inputs
};

type Column = {
  title: string;
  inputs: UserInputField[];
};

function buildFormStructure( props: UserProps ): Column[] {
  let formStructure: Column[] = [];
  if (props.selfChange) {
    formStructure= [
    {
      title: "",
      inputs: [
        { name: "oldPassword", label: "Old Password*", inputType: "input" },
        { name: "newPassword1", label: "New Password*", inputType: "input" },
        { name: "newPassword2", label: "Confirm New Password*", inputType: "input" },
        { name: "passwordsMatch", label: "Passwords Match", inputType: "checkbox" },
        { name: "sixteenChars", label: "16 Characters", inputType: "checkbox" },
        { name: "number", label: "One Number", inputType: "checkbox" },
        { name: "uppercase", label: "One Uppercase Letter", inputType: "checkbox" },
        { name: "lowercase", label: "One Lowercase Letter", inputType: "checkbox" },
        ]
      },
    ];
  }
  else {
    formStructure = [ 
      {
      title: "",
      inputs: [
        { name: "newPassword1", label: "New Password", inputType: "input" },
        { name: "newPassword2", label: "Confirm New Password", inputType: "input" },
        { name: "passwordsMatch", label: "Passwords Match", inputType: "checkbox" },
        { name: "sixteenChars", label: "16 Characters", inputType: "checkbox" },
        { name: "number", label: "One Number", inputType: "checkbox" },
        { name: "uppercase", label: "One Uppercase Letter", inputType: "checkbox" },
        { name: "lowercase", label: "One Lowercase Letter", inputType: "checkbox" },
        ]
      },
    ];
  }
  return formStructure;
}
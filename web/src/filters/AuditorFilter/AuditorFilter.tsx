import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchUserList } from "../../api/users";
import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { useFilters } from "../useFilters";

interface User {
  PersonID: number;
  Name: string;
}

export function AuditorFilter() {
  const { filters, selectedFilters, selectFilter } = useFilters();
  
  const { data: auditors } = useQuery<User[]>("users", () => 
    fetchUserList().then(users => users ?? [])
  );

  const options = useMemo(
    () => [
      { value: "Select Auditor", label: "Select Auditor" },
      ...(auditors ?? []).map((auditor) => ({
        value: auditor.PersonID.toString(),
        label: auditor.Name
      }))
    ],
    [auditors]
  );

  return (
    <div className="filter-container">
      <p>Auditor</p>
      <SingleSelect
        placeholder="Select Auditor"
        value={selectedFilters["Auditor"]?.[0]?.toString() ?? filters["Auditor"]?.[0]?.toString() ?? ""}
        onChange={(value) => selectFilter("Auditor", value === "Select Auditor" ? [] : [parseInt(value, 10)])}
        options={options}
        width="100%"
      />
    </div>
  );
} 
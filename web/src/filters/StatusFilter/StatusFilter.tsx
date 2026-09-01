import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { useFilters } from "../useFilters";

export function StatusFilter() {
  const { filters, selectedFilters, selectFilter } = useFilters();

  return (
    <div className="filter-container">
      <p>Items Missing</p>
      <SingleSelect
        placeholder="Select Status"
        value={selectedFilters["Status"]?.[0] ?? filters["Status"]?.[0] ?? ""}
        onChange={(value) => selectFilter("Status", value === "Select Status" ? [] : [value])}
        options={[
          { value: "Select Status", label: "Select Status" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" }
        ]}
        width="100%"
      />
    </div>
  );
} 
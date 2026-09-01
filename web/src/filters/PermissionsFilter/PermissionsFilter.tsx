import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchPermissions } from "../../api/permissions";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { useFilters } from "../useFilters";

export function PermissionsFilter() {
  const { data, isLoading } = useQuery("Permissions", () => fetchPermissions());
  const { filters, selectedFilters, selectFilter } = useFilters();

  const options = useMemo(() => data?.map((row) => ({ label: row.Name, value: row.PermissionID })), [data]);

  if (isLoading) return <>Loading</>;
  if (data === undefined || options === undefined) return <></>;

  return (
    <div className="filter-container">
      <p>Permissions</p>
      <MultiSelect
        options={options}
        values={selectedFilters["Permission"] ?? filters["Permission"]}
        width="100%"
        placeholder="Select Permissions"
        onChange={(value) => selectFilter("Permission", value)}
      />
    </div>
  );
}

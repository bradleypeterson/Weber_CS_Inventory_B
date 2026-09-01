import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchBuildings } from "../../api/buildings";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import { useFilters } from "../useFilters";

export function BuildingFilter() {
  const { data, isLoading } = useQuery("Buildings", () => fetchBuildings());
  const { filters, selectedFilters, selectFilter } = useFilters();

  const options = useMemo(
    () => data?.filter(isListOptionActive).map((row) => ({ label: row.Name, value: row.BuildingID })),
    [data]
  );

  if (isLoading) return <>Loading</>;
  if (data === undefined || options === undefined) return <></>;

  return (
    <div className="filter-container">
      <p>Building</p>
      <MultiSelect
        options={options}
        values={selectedFilters["Building"] ?? filters["Building"]}
        width="100%"
        placeholder="Select Building"
        onChange={(value) => selectFilter("Building", value)}
      />
    </div>
  );
}

import { useMemo } from "react";
import { useQuery } from "react-query";
import { getAllAssetClasses } from "../../api/assetClasses";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import { useFilters } from "../useFilters";

export function AssetClassFilter() {
  const { data, isLoading } = useQuery("Asset Classes", () => getAllAssetClasses());
  const { filters, selectedFilters, selectFilter } = useFilters();

  const options = useMemo(
    () => data?.filter(isListOptionActive).map((row) => ({ label: row.Name, value: row.AssetClassID })),
    [data]
  );

  if (isLoading) return <>Loading</>;
  if (data === undefined || options === undefined) return <></>;

  return (
    <div className="filter-container">
      <p>Asset Class</p>
      <MultiSelect
        options={options}
        values={selectedFilters["Asset Class"] ?? filters["Asset Class"]}
        width="100%"
        placeholder="Select Asset Class"
        onChange={(value) => selectFilter("Asset Class", value)}
      />
    </div>
  );
}

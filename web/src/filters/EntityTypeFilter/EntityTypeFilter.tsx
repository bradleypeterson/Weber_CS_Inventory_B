import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchSystemNoteEntityTypes } from "../../api/systemNotes";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { useFilters } from "../useFilters";

export function EntityTypeFilter() {
  const { filters, selectedFilters, selectFilter } = useFilters();
  const { data: entityTypes = [] } = useQuery("systemNotesEntityTypes", fetchSystemNoteEntityTypes);
  const values = selectedFilters["Entity Type"] ?? filters["Entity Type"] ?? [];
  const options = useMemo(
    () =>
      entityTypes.map((entityType) => ({
        value: entityType,
        label: entityType
      })),
    [entityTypes]
  );

  return (
    <div className="filter-container">
      <p>Entity Type</p>
      <MultiSelect<string>
        options={options}
        values={values}
        onChange={(next) => selectFilter("Entity Type", next)}
        placeholder="Select entity types"
        width="100%"
        numOfTags={2}
      />
    </div>
  );
}


import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchUserList } from "../../api/users";
import { SingleSelect } from "../../elements/SingleSelect/SingleSelect";
import { useFilters } from "../useFilters";

export function PerformedByFilter() {
  const { filters, selectedFilters, selectFilter } = useFilters();
  const { data: users = [] } = useQuery("systemNotesFilterUsers", fetchUserList);

  const options = useMemo(
    () => [{ value: 0, label: "All users" }, ...users.map((u) => ({ value: u.UserID, label: u.Name }))],
    [users]
  );

  const value = selectedFilters["Performed By"]?.[0] ?? filters["Performed By"]?.[0] ?? 0;

  return (
    <div className="filter-container">
      <p>Performed By</p>
      <SingleSelect<number>
        options={options}
        value={value}
        onChange={(next) => selectFilter("Performed By", next === 0 ? [] : [Number(next)])}
        placeholder="Select user"
        width="100%"
      />
    </div>
  );
}


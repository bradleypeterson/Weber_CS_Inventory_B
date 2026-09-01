import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchRooms } from "../../api/rooms";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import { useFilters } from "../useFilters";

export function RoomFilter() {
  const { data, isLoading } = useQuery("Rooms", () => fetchRooms());
  const { filters, selectedFilters, selectFilter } = useFilters();

  const options = useMemo(
    () => data?.filter(isListOptionActive).map((row) => ({ label: row.RoomNumber, value: row.LocationID })),
    [data]
  );

  if (isLoading) return <>Loading</>;
  if (data === undefined || options === undefined) return <></>;

  return (
    <div className="filter-container">
      <p>Room</p>
      <MultiSelect
        options={options}
        values={selectedFilters["Room"] ?? filters["Room"]}
        width="100%"
        placeholder="Select Room"
        onChange={(value) => selectFilter("Room", value)}
      />
    </div>
  );
}
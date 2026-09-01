import { useEffect, useMemo } from "react";
import { ADMIN_ADJACENT_PERMISSION_IDS, hasAnyPermission } from "../../../../@types/permissions";
import { useQuery } from "react-query";
import { fetchDepartments } from "../../api/departments";
import { isListOptionActive } from "../../utils/listOptionDeleted";
import { fetchUserDetails } from "../../api/users";
import { MultiSelect } from "../../elements/MultiSelect/MultiSelect";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../navigation/useDashboard";
import { useFilters } from "../useFilters";

export function DepartmentFilter() {
  const { data, isLoading: departmentsLoading } = useQuery("Departments", () => fetchDepartments());
  const { filters, selectedFilters, setFilter, selectFilter } = useFilters();
  const { dashboard } = useDashboard();
  const auth = useAuth();

  const isAssetsSearchDashboard = dashboard?.key === "assets/search";
  const isAdmin = hasAnyPermission(auth.permissions, ADMIN_ADJACENT_PERMISSION_IDS);
  const shouldScopeByUserDepartments = isAssetsSearchDashboard && !isAdmin && auth.personID > 0;

  const { data: userDetails, isLoading: userDetailsLoading } = useQuery(
    ["UserDetails", auth.personID],
    () => fetchUserDetails(auth.personID),
    { enabled: shouldScopeByUserDepartments }
  );

  const options = useMemo(() => {
    if (!data) return undefined;

    const scopedDepartments = shouldScopeByUserDepartments
      ? data.filter((department) => userDetails?.DepartmentID.includes(department.DepartmentID))
      : data;

    return scopedDepartments.filter(isListOptionActive).map((row) => ({ label: row.Name, value: row.DepartmentID }));
  }, [data, shouldScopeByUserDepartments, userDetails?.DepartmentID]);

  const sanitizeDepartmentValues = useMemo(
    () => (values: number[] | undefined) => {
      if (!options) return values ?? [];
      const optionIds = new Set(options.map((option) => option.value));
      return (values ?? []).filter((departmentId) => optionIds.has(departmentId));
    },
    [options]
  );

  useEffect(() => {
    if (!shouldScopeByUserDepartments || !options) return;

    const currentApplied = filters["Department"] ?? [];
    const currentSelected = selectedFilters["Department"] ?? [];

    const nextApplied = sanitizeDepartmentValues(currentApplied);
    const nextSelected = sanitizeDepartmentValues(currentSelected);

    if (nextApplied.length !== currentApplied.length) setFilter("Department", nextApplied);
    if (nextSelected.length !== currentSelected.length) selectFilter("Department", nextSelected);
  }, [filters, options, sanitizeDepartmentValues, selectFilter, selectedFilters, setFilter, shouldScopeByUserDepartments]);

  const selectedValues = sanitizeDepartmentValues(selectedFilters["Department"] ?? filters["Department"]);

  if (departmentsLoading || (shouldScopeByUserDepartments && userDetailsLoading)) return <>Loading</>;
  if (data === undefined || options === undefined) return <></>;

  return (
    <div className="filter-container">
      <p>Department</p>
      <MultiSelect
        options={options}
        values={selectedValues}
        width="100%"
        placeholder="Select Department"
        onChange={(value) => selectFilter("Department", value)}
      />
    </div>
  );
}

export const FILTERS_BY_ROUTE_STORAGE_KEY = "filtersByRoute";
export const LEGACY_FILTERS_STORAGE_KEY = "filters";

export function clearPersistedFilters() {
  localStorage.removeItem(FILTERS_BY_ROUTE_STORAGE_KEY);
  localStorage.removeItem(LEGACY_FILTERS_STORAGE_KEY);
}

export const ASSET_SEARCH_STORAGE_PREFIX = "assetSearch:v1:";
export const ASSET_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AssetPageSize = (typeof ASSET_PAGE_SIZES)[number];
export type AssetSearchFilters = { Department?: number[]; "Asset Class"?: number[] };

export type AssetSearchState = {
  searchText: string;
  page: number;
  pageSize: AssetPageSize;
  filters: AssetSearchFilters;
  selectedFilters: AssetSearchFilters;
};

const fallback = new Map<number, AssetSearchState>();
const memoryOnly = new Set<number>();

function defaults(): AssetSearchState {
  return { searchText: "", page: 1, pageSize: 10, filters: {}, selectedFilters: {} };
}

function parseFilters(raw: unknown): AssetSearchFilters {
  const filters: AssetSearchFilters = {};
  if (typeof raw !== "object" || raw === null) return filters;
  for (const key of ["Department", "Asset Class"] as const) {
    const values = (raw as AssetSearchFilters)[key];
    if (!Array.isArray(values)) continue;
    const ids = [...new Set(values.filter((id) => Number.isSafeInteger(id) && id > 0))];
    if (ids.length > 0) filters[key] = ids;
  }
  return filters;
}

function parse(raw: unknown): AssetSearchState {
  if (typeof raw !== "object" || raw === null) return defaults();
  const value = raw as Partial<AssetSearchState>;
  return {
    searchText: typeof value.searchText === "string" ? value.searchText : "",
    page: Number.isSafeInteger(value.page) && Number(value.page) > 0 ? Number(value.page) : 1,
    pageSize: ASSET_PAGE_SIZES.includes(value.pageSize as AssetPageSize) ? value.pageSize as AssetPageSize : 10,
    filters: parseFilters(value.filters),
    selectedFilters: parseFilters(value.selectedFilters ?? value.filters)
  };
}

export function loadAssetSearchState(personID: number): AssetSearchState {
  if (!Number.isSafeInteger(personID) || personID <= 0) return defaults();
  if (memoryOnly.has(personID)) return fallback.get(personID) ?? defaults();
  try {
    const stored = sessionStorage.getItem(`${ASSET_SEARCH_STORAGE_PREFIX}${personID}`);
    try {
      return stored === null ? defaults() : parse(JSON.parse(stored));
    } catch {
      return defaults();
    }
  } catch {
    return fallback.get(personID) ?? defaults();
  }
}

export function saveAssetSearchState(personID: number, changes: Partial<AssetSearchState>): void {
  if (!Number.isSafeInteger(personID) || personID <= 0) return;
  const state = parse({ ...loadAssetSearchState(personID), ...changes });
  fallback.set(personID, state);
  try {
    sessionStorage.setItem(`${ASSET_SEARCH_STORAGE_PREFIX}${personID}`, JSON.stringify(state));
  } catch {
    // Keep navigation usable when browser storage is unavailable.
    memoryOnly.add(personID);
  }
}

export function clearAssetSearchState(): void {
  fallback.clear();
  memoryOnly.clear();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index--) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(ASSET_SEARCH_STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage may be disabled by the browser.
  }
}

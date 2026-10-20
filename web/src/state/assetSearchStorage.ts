export const ASSET_SEARCH_STORAGE_PREFIX = "assetSearch:v1:";
export const ASSET_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AssetPageSize = (typeof ASSET_PAGE_SIZES)[number];

export type AssetSearchState = {
  searchText: string;
  page: number;
  pageSize: AssetPageSize;
};

const fallback = new Map<number, AssetSearchState>();

function defaults(): AssetSearchState {
  return { searchText: "", page: 1, pageSize: 10 };
}

function parse(raw: unknown): AssetSearchState {
  if (typeof raw !== "object" || raw === null) return defaults();
  const value = raw as Partial<AssetSearchState>;
  return {
    searchText: typeof value.searchText === "string" ? value.searchText : "",
    page: Number.isSafeInteger(value.page) && Number(value.page) > 0 ? Number(value.page) : 1,
    pageSize: ASSET_PAGE_SIZES.includes(value.pageSize as AssetPageSize) ? value.pageSize as AssetPageSize : 10
  };
}

export function loadAssetSearchState(personID: number): AssetSearchState {
  if (!Number.isSafeInteger(personID) || personID <= 0) return defaults();
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
  }
}

export function clearAssetSearchState(): void {
  fallback.clear();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index--) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(ASSET_SEARCH_STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage may be disabled by the browser.
  }
}

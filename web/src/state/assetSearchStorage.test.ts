import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ASSET_SEARCH_STORAGE_PREFIX,
  clearAssetSearchState,
  loadAssetSearchState,
  saveAssetSearchState
} from "./assetSearchStorage";

beforeEach(clearAssetSearchState);

describe("asset search storage", () => {
  it("merges filter and pagination updates without losing either", () => {
    saveAssetSearchState(7, { searchText: "laptop", page: 3, pageSize: 25 });
    saveAssetSearchState(7, { filters: { Department: [2] }, selectedFilters: { Department: [3] } });
    saveAssetSearchState(7, { page: 4 });
    expect(loadAssetSearchState(7)).toEqual({
      searchText: "laptop", page: 4, pageSize: 25,
      filters: { Department: [2] }, selectedFilters: { Department: [3] }
    });
    expect(localStorage.length).toBe(0);
  });

  it("isolates users and starts fresh with an empty tab store", () => {
    saveAssetSearchState(7, { searchText: "private", page: 3 });
    expect(loadAssetSearchState(8).searchText).toBe("");
    sessionStorage.clear();
    expect(loadAssetSearchState(7).page).toBe(1);
  });

  it.each(["{", "null", "[]", '"text"'])("accepts corrupt or invalid storage: %s", (raw) => {
    sessionStorage.setItem(`${ASSET_SEARCH_STORAGE_PREFIX}7`, raw);
    expect(loadAssetSearchState(7)).toEqual({ searchText: "", page: 1, pageSize: 10, filters: {}, selectedFilters: {} });
  });

  it("validates pagination and filter IDs", () => {
    sessionStorage.setItem(`${ASSET_SEARCH_STORAGE_PREFIX}7`, JSON.stringify({
      searchText: 12, page: -4, pageSize: 11,
      filters: { Department: [2, 2, -1, "3", 1.5], "Asset Class": "bad", Permission: [8] }
    }));
    expect(loadAssetSearchState(7)).toEqual({
      searchText: "", page: 1, pageSize: 10, filters: { Department: [2] }, selectedFilters: { Department: [2] }
    });
  });

  it("keeps in-memory state when storage is blocked and clears it on logout", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    saveAssetSearchState(7, { page: 3 });
    saveAssetSearchState(7, { searchText: "test" });
    expect(loadAssetSearchState(7).page).toBe(3);
    clearAssetSearchState();
    expect(loadAssetSearchState(7).searchText).toBe("");
  });

  it("clears only asset search entries and rejects anonymous owners", () => {
    sessionStorage.setItem("unrelated", "keep");
    saveAssetSearchState(0, { page: 3 });
    expect(sessionStorage.length).toBe(1);
    saveAssetSearchState(7, { page: 3 });
    saveAssetSearchState(8, { page: 2 });
    clearAssetSearchState();
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });

  it("keeps the latest state when reads work but writes exceed quota", () => {
    saveAssetSearchState(7, { page: 2 });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    saveAssetSearchState(7, { page: 3 });
    saveAssetSearchState(7, { searchText: "laptop" });
    expect(loadAssetSearchState(7).page).toBe(3);
    expect(loadAssetSearchState(7).searchText).toBe("laptop");
  });
});

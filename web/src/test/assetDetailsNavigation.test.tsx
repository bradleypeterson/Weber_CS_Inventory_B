import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter, Route, Routes } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import { PermissionId } from "../../../@types/permissions";
import { AuthProvider } from "../context/AuthProvider";
import { AssetsDetailsDashboard } from "../dashboards/AssetsDetailsDashboard/AssetsDetailsDashboard";
import { AssetsSearchDashboard } from "../dashboards/AssetsSearchDashboard/AssetsSearchDashboard";
import { FilterProvider } from "../filters/FilterProvider";
import { useAuth } from "../hooks/useAuth";
import { saveAssetSearchState } from "../state/assetSearchStorage";

vi.mock("../auth/sessionTimeout", () => ({
  sessionActivityEvent: "session-activity",
  watchSessionTimeout: () => () => {}
}));

vi.mock("../api/assets", () => ({
  addNewNote: vi.fn(),
  archiveAssets: vi.fn(),
  fetchAssetsExport: vi.fn(),
  fetchAssetIdByTagNumber: vi.fn(),
  updateAssetDetails: vi.fn(),
  fetchAssetNotes: async () => [],
  fetchAssetDetails: async (id: number) => ({ EquipmentID: id, TagNumber: `laptop-${id}` }),
  fetchAssetOverviewList: async () => Array.from({ length: 72 }, (_, index) => ({
    EquipmentID: index + 1,
    TagNumber: `${index < 70 ? "laptop" : "monitor"}-${index + 1}`,
    DepartmentID: index < 60 ? 1 : 2
  }))
}));

vi.mock("../api/systemNotes", () => ({
  fetchSystemNotes: async () => ({ rows: [], total: 0 })
}));

vi.mock("../hooks/optionHooks", () => {
  const useOptions = () => ({ data: [], isLoading: false });
  return {
    useAssetClasses: useOptions,
    useAssetContactPersons: useOptions,
    useBuildings: useOptions,
    useConditions: useOptions,
    useDepartments: useOptions,
    useDeviceTypes: useOptions,
    useFiscalYears: useOptions,
    useRooms: useOptions
  };
});

function AssetRoutes() {
  const { token } = useAuth();
  if (!token) return null;
  return (
    <FilterProvider>
      <Routes>
        <Route path="/assets/search" element={<AssetsSearchDashboard />} />
        <Route path="/assets/asset-details" element={<AssetsDetailsDashboard />} />
      </Routes>
    </FilterProvider>
  );
}

function mount() {
  render(<BrowserRouter><AuthProvider><AssetRoutes /></AuthProvider></BrowserRouter>);
}

beforeEach(() => {
  window.history.replaceState(null, "", "/assets/search");
  localStorage.setItem("token", "viewer-token");
  localStorage.setItem("personID", "7");
});

it("returns a read-only viewer to the same search filters and page", async () => {
  saveAssetSearchState(7, {
    searchText: "laptop",
    page: 2,
    pageSize: 25,
    filters: { Department: [1] },
    selectedFilters: { Department: [1] }
  });
  mount();
  await screen.findByText("Page 2 of 3 (60 results)");
  expect(screen.getByText("laptop-26")).toBeTruthy();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
  await screen.findByRole("heading", { name: "Asset Details" });
  expect(screen.queryByRole("button", { name: "Edit asset" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByText("Page 2 of 3 (60 results)");
  expect(screen.getByText("laptop-26")).toBeTruthy();
  expect(screen.getByPlaceholderText<HTMLInputElement>("search").value).toBe("laptop");
  expect(screen.getByLabelText<HTMLSelectElement>("Rows:").value).toBe("25");
});

it("falls back to search for a direct asset link even with unrelated browser history", async () => {
  window.history.pushState(null, "", "/assets/asset-details?assetId=1");
  localStorage.setItem("permissions", JSON.stringify([PermissionId.ADD_EDIT_ASSETS]));
  mount();
  await screen.findByRole("heading", { name: "Asset Details" });
  expect(screen.getByRole("button", { name: "Edit asset" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByText("Page 1 of 8 (72 results)");
  expect(window.location.pathname).toBe("/assets/search");
  expect(window.history.state.idx).toBe(0);
});

it("offers the search fallback on the tag lookup screen", async () => {
  window.history.replaceState(null, "", "/assets/asset-details?assetId=invalid");
  mount();
  await screen.findByText("Invalid asset ID");
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByText("Page 1 of 8 (72 results)");
});

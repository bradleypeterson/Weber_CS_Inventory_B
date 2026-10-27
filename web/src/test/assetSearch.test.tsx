import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import type { AssetOverview } from "../../../@types/data";
import { AuthProvider } from "../context/AuthProvider";
import { AssetsSearchDashboard } from "../dashboards/AssetsSearchDashboard/AssetsSearchDashboard";
import { FilterProvider } from "../filters/FilterProvider";
import { useFilters } from "../filters/useFilters";
import { useAuth } from "../hooks/useAuth";
import { clearAssetSearchState, loadAssetSearchState, saveAssetSearchState } from "../state/assetSearchStorage";

const api = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("../api/assets", () => ({ fetchAssetOverviewList: api.list, archiveAssets: vi.fn(), fetchAssetsExport: vi.fn() }));
vi.mock("../export/downloadExport", () => ({ downloadExport: vi.fn() }));
vi.mock("@phosphor-icons/react", () => ({ MagnifyingGlass: () => "Inspect", Trash: () => "Archive" }));
vi.mock("../navigation/useDashboard", () => ({
  useDashboard: () => ({ dashboard: { key: useLocation().pathname.slice(1) } })
}));
vi.mock("../navigation/useLinkTo", () => ({
  useLinkTo: () => {
    const navigate = useNavigate();
    return (_label: string, _parents: string[], params: string) => navigate(`/assets/asset-details?${params}`);
  }
}));

const rows = Array.from({ length: 140 }, (_, index) => ({
  EquipmentID: index + 1,
  TagNumber: `asset-${String(index + 1).padStart(3, "0")}`,
  DepartmentID: index < 100 ? 1 : 2,
  Department: index < 100 ? "Computing" : "Science",
  AssetClassID: 1,
  AssetClass: "Equipment",
  DeviceType: "Laptop"
})) as AssetOverview[];

function FilterControls() {
  const { filters, selectedFilters, selectFilter, apply, resetFilters } = useFilters();
  return <>
    <button onClick={() => selectFilter("Department", [1])}>Choose Computing</button>
    <button onClick={() => selectFilter("Department", [2])}>Choose Science</button>
    <button onClick={apply}>Apply filters</button>
    <button onClick={resetFilters}>Reset filters</button>
    <output data-testid="applied">{JSON.stringify(filters)}</output>
    <output data-testid="draft">{JSON.stringify(selectedFilters)}</output>
  </>;
}

function Session() {
  const auth = useAuth();
  const navigate = useNavigate();
  if (!auth.token) return <button onClick={() => {
    localStorage.setItem("token", "second-token");
    localStorage.setItem("personID", "8");
    auth.setToken("second-token");
    auth.setPersonID(8);
    navigate("/assets/search");
  }}>Login as second user</button>;
  return <FilterProvider key={`${auth.personID}-${auth.token}`}>
    <button onClick={auth.logout}>Logout</button>
    <button onClick={() => navigate("/assets/search")}>Sidebar search</button>
    <Routes>
      <Route path="/assets/search" element={<><FilterControls /><AssetsSearchDashboard /></>} />
      <Route path="/assets/asset-details" element={<button onClick={() => navigate(-1)}>Back from details</button>} />
      <Route path="/admin/users" element={<FilterControls />} />
    </Routes>
  </FilterProvider>;
}

function mount(path = "/assets/search") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  const view = render(<StrictMode><QueryClientProvider client={client}><AuthProvider>
    <MemoryRouter initialEntries={[path]}><Session /></MemoryRouter>
  </AuthProvider></QueryClientProvider></StrictMode>);
  return { ...view, client };
}

function seedSearch() {
  saveAssetSearchState(7, {
    searchText: "asset", page: 3, pageSize: 25,
    filters: { Department: [1], "Asset Class": [1] },
    selectedFilters: { Department: [1], "Asset Class": [1] }
  });
}

beforeEach(() => {
  clearAssetSearchState();
  localStorage.setItem("token", "test-token");
  localStorage.setItem("personID", "7");
  localStorage.setItem("permissions", "[]");
  api.list.mockReset().mockResolvedValue(rows);
});

it.each(["Back from details", "Sidebar search"])("restores results through %s", async (returnButton) => {
  seedSearch();
  mount();
  await screen.findByText("Page 3 of 4 (100 results)");
  expect(screen.getByText("asset-051")).toBeTruthy();
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
  await screen.findByRole("button", { name: "Back from details" });
  fireEvent.click(screen.getByRole("button", { name: returnButton }));
  await screen.findByText("Page 3 of 4 (100 results)");
  expect((screen.getByPlaceholderText("search") as HTMLInputElement).value).toBe("asset");
  expect((screen.getByLabelText("Rows:") as HTMLSelectElement).value).toBe("25");
  expect((screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked).toBe(false);
  expect(screen.getByTestId("applied").textContent).toContain('"Department":[1]');
});

it("restores a fresh mount without applying unsubmitted filter edits", async () => {
  seedSearch();
  const view = mount();
  await screen.findByText("Page 3 of 4 (100 results)");
  fireEvent.click(screen.getByText("Choose Science"));
  view.unmount();
  view.client.clear();
  mount();
  await screen.findByText("Page 3 of 4 (100 results)");
  expect(screen.getByTestId("applied").textContent).toContain('"Department":[1]');
  expect(screen.getByTestId("draft").textContent).toContain('"Department":[2]');
  fireEvent.click(screen.getByText("Apply filters"));
  await screen.findByText("Page 1 of 2 (40 results)");
});

it("resets pagination for search, row count, and filter reset", async () => {
  seedSearch();
  mount();
  await screen.findByText("Page 3 of 4 (100 results)");
  fireEvent.change(screen.getByLabelText("Rows:"), { target: { value: "10" } });
  await screen.findByText("Page 1 of 10 (100 results)");
  fireEvent.click(screen.getByRole("button", { name: ">" }));
  fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "asset-0" } });
  await screen.findByText("Page 1 of 10 (99 results)");
  fireEvent.click(screen.getByRole("button", { name: ">" }));
  fireEvent.click(screen.getByText("Reset filters"));
  await screen.findByText("Page 1 of 10 (99 results)");
});

it("waits for loading and preserves the page during background refresh", async () => {
  seedSearch();
  let resolve!: (value: AssetOverview[]) => void;
  api.list.mockImplementation(() => new Promise<AssetOverview[]>((done) => { resolve = done; }));
  const { client } = mount();
  await waitFor(() => expect(api.list).toHaveBeenCalled());
  expect(loadAssetSearchState(7).page).toBe(3);
  await act(async () => resolve(rows));
  await screen.findByText("Page 3 of 4 (100 results)");
  act(() => { void client.invalidateQueries("AssetsList"); });
  await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
  expect(loadAssetSearchState(7).page).toBe(3);
  await act(async () => resolve([...rows]));
  await screen.findByText("Page 3 of 4 (100 results)");
  api.list.mockResolvedValue(rows.slice(0, 30));
  await act(async () => { await client.invalidateQueries("AssetsList"); });
  await screen.findByText("Page 2 of 2 (30 results)");
  api.list.mockResolvedValue([]);
  await act(async () => { await client.invalidateQueries("AssetsList"); });
  await screen.findByText("Page 1 of 1 (0 results)");
});

it("does not clamp a saved page after a failed request", async () => {
  seedSearch();
  api.list.mockResolvedValue(undefined);
  mount();
  await waitFor(() => expect(api.list).toHaveBeenCalled());
  expect(loadAssetSearchState(7).page).toBe(3);
});

it("clears state on logout and does not resurrect it for another user", async () => {
  seedSearch();
  mount();
  await screen.findByText("Page 3 of 4 (100 results)");
  fireEvent.click(screen.getByText("Logout"));
  fireEvent.click(await screen.findByText("Login as second user"));
  await screen.findByText("Page 1 of 14 (140 results)");
  expect((screen.getByPlaceholderText("search") as HTMLInputElement).value).toBe("");
  expect(screen.getByTestId("applied").textContent).toBe("{}");
  expect(loadAssetSearchState(7).searchText).toBe("");
});

it("discards legacy asset filters while preserving other dashboards", async () => {
  localStorage.setItem("filtersByRoute", JSON.stringify({
    "assets/search": { Department: [2] }, "admin/users": { Department: [1] }
  }));
  const view = mount();
  await screen.findByText("Page 1 of 14 (140 results)");
  expect(JSON.parse(localStorage.getItem("filtersByRoute") ?? "{}")).toEqual({ "admin/users": { Department: [1] } });
  view.unmount();
  mount("/admin/users");
  await waitFor(() => expect(screen.getByTestId("applied").textContent).toBe('{"Department":[1]}'));
});

it("renders and navigates when session storage is blocked", async () => {
  const getItem = Storage.prototype.getItem;
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
    if (this === sessionStorage) throw new Error("blocked");
    return getItem.call(this, key);
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (this === sessionStorage) throw new Error("blocked");
    setItem.call(this, key, value);
  });
  mount();
  await screen.findByText("Page 1 of 14 (140 results)");
  fireEvent.click(screen.getByRole("button", { name: ">" }));
  await screen.findByText("Page 2 of 14 (140 results)");
});

it("saves a search created through the UI and restores it after navigating away", async () => {
  mount();
  await screen.findByText("Page 1 of 14 (140 results)");
  fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "asset" } });
  fireEvent.click(screen.getByText("Choose Computing"));
  fireEvent.click(screen.getByText("Apply filters"));
  fireEvent.change(screen.getByLabelText("Rows:"), { target: { value: "25" } });
  await screen.findByText("Page 1 of 4 (100 results)");
  fireEvent.click(screen.getByRole("button", { name: ">" }));
  fireEvent.click(screen.getByRole("button", { name: ">" }));
  await screen.findByText("Page 3 of 4 (100 results)");
  expect(loadAssetSearchState(7)).toMatchObject({
    searchText: "asset", page: 3, pageSize: 25,
    filters: { Department: [1] }, selectedFilters: { Department: [1] }
  });
  fireEvent.click(screen.getAllByRole("checkbox")[0]);
  fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
  fireEvent.click(await screen.findByRole("button", { name: "Back from details" }));
  await screen.findByText("Page 3 of 4 (100 results)");
  expect(screen.getByText("asset-051")).toBeTruthy();
});

it("keeps the saved page after a rejected background request and recovers on retry", async () => {
  seedSearch();
  const { client } = mount();
  await screen.findByText("Page 3 of 4 (100 results)");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  api.list.mockRejectedValueOnce(new Error("network unavailable"));
  await act(async () => { await client.invalidateQueries("AssetsList"); });
  expect(client.getQueryState("AssetsList")?.status).toBe("error");
  expect(loadAssetSearchState(7).page).toBe(3);
  api.list.mockResolvedValue(rows);
  await act(async () => { await client.invalidateQueries("AssetsList"); });
  await screen.findByText("Page 3 of 4 (100 results)");
});

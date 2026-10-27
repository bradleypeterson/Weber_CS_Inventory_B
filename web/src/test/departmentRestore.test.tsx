import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { expect, it, vi } from "vitest";
import { DepartmentFilter } from "../filters/DepartmentFilter/DepartmentFilter";
import { FilterContext } from "../filters/FilterContext";

const api = vi.hoisted(() => ({ departments: vi.fn(), user: vi.fn() }));
vi.mock("../api/departments", () => ({ fetchDepartments: api.departments }));
vi.mock("../api/users", () => ({ fetchUserDetails: api.user }));
vi.mock("../hooks/useAuth", () => ({ useAuth: () => ({ permissions: [], personID: 7 }) }));
vi.mock("../navigation/useDashboard", () => ({ useDashboard: () => ({ dashboard: { key: "assets/search" } }) }));
vi.mock("../elements/MultiSelect/MultiSelect", () => ({
  MultiSelect: ({ values }: { values: number[] }) => <output>{JSON.stringify(values)}</output>
}));

it("waits for department permissions before sanitizing restored filters", async () => {
  api.departments.mockResolvedValue([{ DepartmentID: 1, Name: "Computing" }, { DepartmentID: 2, Name: "Science" }]);
  let resolve!: (value: { DepartmentID: number[] }) => void;
  api.user.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const setFilter = vi.fn();
  const selectFilter = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><FilterContext.Provider value={{
    filters: { Department: [1, 2] }, selectedFilters: { Department: [1, 2] },
    setFilter, selectFilter, apply: vi.fn(), resetFilters: vi.fn()
  }}><DepartmentFilter /></FilterContext.Provider></QueryClientProvider>);
  await waitFor(() => expect(client.getQueryData("Departments")).toBeDefined());
  expect(setFilter).not.toHaveBeenCalled();
  expect(selectFilter).not.toHaveBeenCalled();
  await act(async () => resolve({ DepartmentID: [1] }));
  await screen.findByText("[1]");
  expect(setFilter).toHaveBeenCalledWith("Department", [1]);
  expect(selectFilter).toHaveBeenCalledWith("Department", [1]);
});

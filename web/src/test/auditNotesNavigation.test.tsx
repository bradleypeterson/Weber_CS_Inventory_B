import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import { PermissionId } from "../../../@types/permissions";
import { fetchAuditDetails, fetchAuditNotes, updateAuditNotes } from "../api/audit";
import { AuditDetailsDashboard } from "../dashboards/AuditDetailsDashboard/AuditDetailsDashboard";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ token: "test", permissions: [PermissionId.ADD_EDIT_ASSETS] })
}));
vi.mock("../api/audit", () => ({
  fetchAuditDetails: vi.fn(), fetchAuditNotes: vi.fn(), updateAuditNotes: vi.fn()
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchAuditDetails).mockResolvedValue([{ tag_number: "LT-4", device_type: "Laptop" }]);
  vi.mocked(fetchAuditNotes).mockResolvedValue([{ tagNumber: "LT-4", note: "Original note" }]);
  vi.mocked(updateAuditNotes).mockResolvedValue(true);
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/audits/history/details?audit_id=7"]}>
        <Routes>
          <Route path="/audits/history/details" element={<AuditDetailsDashboard />} />
          <Route path="/audits/history" element={<h1>Audit History</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return client;
}

it("returns to Audit History directly when the notes are unchanged", async () => {
  mount();
  await screen.findByText("Original note");
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByRole("heading", { name: "Audit History" });
  expect(updateAuditNotes).not.toHaveBeenCalled();
});

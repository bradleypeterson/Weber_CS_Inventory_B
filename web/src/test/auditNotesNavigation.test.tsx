import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { PermissionId } from "../../../@types/permissions";
import { fetchAuditDetails, fetchAuditNotes, updateAuditNotes } from "../api/audit";
import { AuditDetailsDashboard } from "../dashboards/AuditDetailsDashboard/AuditDetailsDashboard";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ token: "test", permissions: [PermissionId.ADD_EDIT_ASSETS] })
}));
vi.mock("../api/audit", () => ({
  fetchAuditDetails: vi.fn(), fetchAuditNotes: vi.fn(), updateAuditNotes: vi.fn()
}));

// jsdom does not implement the native dialog methods used by Modal.
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } }
  });
});
afterAll(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

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
        <Link to="/audits/history/details?audit_id=8">Open audit 8</Link>
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

async function editNote(text: string) {
  fireEvent.click(await screen.findByRole("button", { name: "Edit note for LT-4" }));
  const editor = within(screen.getByRole("dialog"));
  fireEvent.change(editor.getByRole("textbox"), { target: { value: text } });
  fireEvent.click(editor.getByRole("button", { name: "Update" }));
}

function requestBack() {
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  return within(screen.getByRole("dialog", { name: "Discard unsaved audit notes?" }));
}

it("keeps the draft on Details and allows further editing", async () => {
  mount();
  await editNote("Check battery");
  fireEvent.click(requestBack().getByRole("button", { name: "Keep editing" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(within(screen.getByRole("article")).getByText("Check battery")).toBeTruthy();
  await editNote("Battery replaced");
  expect(within(screen.getAllByRole("article")[0]).getByText("Battery replaced")).toBeTruthy();
  expect(updateAuditNotes).not.toHaveBeenCalled();
});

it("discards a draft and goes to History without saving", async () => {
  const client = mount();
  await editNote("Check battery");
  fireEvent.click(requestBack().getByRole("button", { name: "Discard changes" }));
  await screen.findByRole("heading", { name: "Audit History" });
  expect(updateAuditNotes).not.toHaveBeenCalled();
  expect(client.getQueryData(["auditNotes", "7"])).toEqual([{ tagNumber: "LT-4", note: "Original note" }]);
});

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
}

it("keeps a failed save editable and leaves directly after a successful retry", async () => {
  vi.mocked(updateAuditNotes).mockRejectedValueOnce(new Error("Failed to validate data"));
  mount();
  await editNote("Check battery");
  save();
  await screen.findByRole("alert");
  fireEvent.click(requestBack().getByRole("button", { name: "Keep editing" }));
  expect(within(screen.getByRole("article")).getByText("Check battery")).toBeTruthy();
  await editNote("Battery replaced");
  save();
  await waitFor(() => expect(screen.queryByRole("button", { name: /sav(e changes|ing)/i })).toBeNull());
  expect(updateAuditNotes).toHaveBeenCalledTimes(2);
  expect(updateAuditNotes).toHaveBeenLastCalledWith("7", [{ tagNumber: "LT-4", note: "Battery replaced" }]);
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByRole("heading", { name: "Audit History" });
});

it("can discard after a failed save without sending another update", async () => {
  vi.mocked(updateAuditNotes).mockRejectedValueOnce(new Error("Network unavailable"));
  mount();
  await editNote("Check battery");
  save();
  await screen.findByRole("alert");
  fireEvent.click(requestBack().getByRole("button", { name: "Discard changes" }));
  await screen.findByRole("heading", { name: "Audit History" });
  expect(updateAuditNotes).toHaveBeenCalledTimes(1);
});

it("keeps edited text across a refetch and submits only the edited tag", async () => {
  const client = mount();
  await editNote("Battery replaced");
  const refreshed = [
    { tagNumber: "LT-4", note: "Original note" },
    { tagNumber: "LT-5", note: "Updated by a coworker" }
  ];
  vi.mocked(fetchAuditNotes).mockResolvedValue(refreshed);
  await act(() => client.refetchQueries(["auditNotes", "7"]));
  expect(within(screen.getAllByRole("article")[0]).getByText("Battery replaced")).toBeTruthy();
  expect(screen.getByText("Updated by a coworker")).toBeTruthy();
  save();
  await waitFor(() => expect(client.getQueryData(["auditNotes", "7"])).toEqual([
    { tagNumber: "LT-4", note: "Battery replaced" }, refreshed[1]
  ]));
  expect(updateAuditNotes).toHaveBeenCalledWith("7", [{ tagNumber: "LT-4", note: "Battery replaced" }]);
});

it("leaves directly after the user restores the original note", async () => {
  mount();
  await editNote("Check battery");
  await editNote("Original note");
  expect(screen.queryByRole("button", { name: "Save Changes" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByRole("heading", { name: "Audit History" });
  expect(updateAuditNotes).not.toHaveBeenCalled();
});

it("waits for a pending save before allowing Back or another edit", async () => {
  let finishSave!: (saved: boolean) => void;
  vi.mocked(updateAuditNotes).mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
  mount();
  await editNote("Battery replaced");
  save();
  const pending = await screen.findByRole<HTMLButtonElement>("button", { name: "Saving..." });
  const back = screen.getByRole<HTMLButtonElement>("button", { name: "Back" });
  expect(pending.disabled).toBe(true);
  expect(back.disabled).toBe(true);
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Edit note for LT-4" }).disabled).toBe(true);
  fireEvent.click(back);
  expect(screen.getByRole("heading", { name: "Audit Details" })).toBeTruthy();

  await act(async () => finishSave(true));
  await waitFor(() => expect(back.disabled).toBe(false));
  fireEvent.click(back);
  await screen.findByRole("heading", { name: "Audit History" });
  expect(updateAuditNotes).toHaveBeenCalledTimes(1);
});

it("opens another audit without carrying over the previous audit's draft", async () => {
  vi.mocked(fetchAuditNotes).mockImplementation(async id => [
    { tagNumber: "LT-4", note: id === "7" ? "Original note" : "Second audit note" }
  ]);
  mount();
  await editNote("First audit draft");
  fireEvent.click(screen.getByRole("link", { name: "Open audit 8" }));
  await screen.findByText("Second audit note");
  expect(screen.queryByRole("button", { name: "Save Changes" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByRole("heading", { name: "Audit History" });
  expect(updateAuditNotes).not.toHaveBeenCalled();
});

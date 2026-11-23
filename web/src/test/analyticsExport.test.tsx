import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { AssetAnalytics } from "../../../@types/analytics";
import { fetchAssetAnalytics } from "../api/analytics";
import AnalyticsDashboard from "../dashboards/AnalyticsDashboard/AnalyticsDashboard";

vi.mock("../api/analytics", () => ({ fetchAssetAnalytics: vi.fn() }));
vi.mock("../navigation/useLinkTo", () => ({ useLinkTo: () => vi.fn() }));

// Seeded Analytics API responses for the department-scoped account W01111112.
const scoped: AssetAnalytics = {
  totalActiveAssets: 34,
  byDepartment: [{ id: 2, name: "Computer Science", count: 34 }],
  byDeviceType: [
    { id: 2, name: "Laptop/Notebook", count: 5 },
    { id: 1, name: "Digital Camera", count: 4 },
    { id: 6, name: "Printer", count: 4 },
    { id: 5, name: "Projector", count: 4 },
    { id: 8, name: "TV(any type)", count: 4 },
    { id: 9, name: "Virtual Computer Device", count: 4 },
    { id: 3, name: "Other", count: 3 },
    { id: 4, name: "Personal Computer", count: 3 },
    { id: 7, name: "Tablet", count: 3 }
  ],
  byCondition: [{ id: null, name: "Unassigned", count: 33 }, { id: 2, name: "Excellent", count: 1 }]
};
const filtered: AssetAnalytics = {
  totalActiveAssets: 4,
  byDepartment: [{ id: 2, name: "Computer Science", count: 4 }],
  byDeviceType: [{ id: 6, name: "Printer", count: 4 }],
  byCondition: [{ id: null, name: "Unassigned", count: 4 }]
};
const empty: AssetAnalytics = { totalActiveAssets: 0, byDepartment: [], byDeviceType: [], byCondition: [] };
const fetchAnalytics = vi.mocked(fetchAssetAnalytics);

beforeEach(() => fetchAnalytics.mockReset());
afterEach(() => vi.unstubAllGlobals());

function captureDownloads() {
  const create = vi.fn<(blob: Blob) => string>().mockReturnValue("blob:analytics");
  const revoke = vi.fn();
  vi.stubGlobal("URL", Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }));
  const filenames: string[] = [];
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    filenames.push(this.download);
  });
  return { create, revoke, click, filenames };
}

function readCsv(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function visibleCsvRows() {
  const summary = within(screen.getByLabelText("Asset summary"));
  const summaryRows = summary.getAllByRole("term").map(term =>
    `Summary,${term.textContent},${term.nextElementSibling?.textContent},`
  );
  const sections = [
    ["Assets by department", "Department"], ["Assets by device type", "Device Type"], ["Assets by condition", "Condition"]
  ];
  const chartRows = sections.flatMap(([title, category]) =>
    within(screen.getByRole("region", { name: title })).getAllByRole("button").map(bar => {
      const [, name, count] = bar.getAttribute("aria-label")!.match(/^View (.+) assets \((\d+)\)$/)!;
      const percentage = within(bar).getByText(/^\(\d+\.\d%\)$/).textContent?.slice(1, -1);
      return `${category},${name},${count},${percentage}`;
    })
  );
  return ["Category,Name,Count,Percentage", ...summaryRows, ...chartRows];
}

it("exports the complete scoped seed results before and after applying both filters", async () => {
  const downloads = captureDownloads();
  fetchAnalytics.mockImplementation(async filters => filters?.deviceTypeId === 6 ? filtered : scoped);
  render(<AnalyticsDashboard />);
  const button = screen.getByRole<HTMLButtonElement>("button", { name: "Export CSV" });
  expect(button.disabled).toBe(true);
  await waitFor(() => expect(button.disabled).toBe(false));
  expect(screen.queryByRole("option", { name: "School of Computing" })).toBeNull();
  fireEvent.click(button);
  expect(button.disabled).toBe(true);
  await waitFor(() => expect(downloads.click).toHaveBeenCalledTimes(1));
  const allCsv = await readCsv(downloads.create.mock.calls[0][0]);
  expect(allCsv.split("\r\n")).toEqual(visibleCsvRows());
  expect(allCsv).not.toContain("School of Computing");
  expect(allCsv).toContain("Condition,Excellent,1,2.9%");
  expect(downloads.filenames[0]).toMatch(/^analytics-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(downloads.create.mock.calls[0][0].type).toBe("text/csv;charset=utf-8");

  fireEvent.change(screen.getByLabelText("Department"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Device type"), { target: { value: "6" } });
  expect(button.disabled).toBe(true);
  await waitFor(() => expect(button.disabled).toBe(false));
  expect(fetchAnalytics).toHaveBeenLastCalledWith({ departmentId: 2, deviceTypeId: 6 });
  fireEvent.click(button);
  await waitFor(() => expect(downloads.click).toHaveBeenCalledTimes(2));
  const filteredCsv = await readCsv(downloads.create.mock.calls[1][0]);
  expect(filteredCsv.split("\r\n")).toEqual(visibleCsvRows());
  expect(filteredCsv).toContain("Summary,Total active assets,4,");
  expect(filteredCsv).toContain("Device Type,Printer,4,100.0%");
  expect(filteredCsv).not.toContain("Laptop/Notebook");
});

it("disables empty results and re-enables export when filters are cleared", async () => {
  fetchAnalytics.mockImplementation(async filters => filters?.deviceTypeId === 6 ? empty : scoped);
  const downloads = captureDownloads();
  render(<AnalyticsDashboard />);
  await screen.findByRole("option", { name: "Printer" });
  const button = screen.getByRole<HTMLButtonElement>("button", { name: "Export CSV" });
  fireEvent.change(screen.getByLabelText("Device type"), { target: { value: "6" } });
  await screen.findByText("No active assets match these filters within your access permissions.");
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(downloads.click).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await waitFor(() => expect(button.disabled).toBe(false));
});

it("reports an export failure, keeps analytics visible, and lets the user retry", async () => {
  fetchAnalytics.mockResolvedValue(filtered);
  const downloads = captureDownloads();
  downloads.click.mockImplementationOnce(() => { throw new Error("Download failed"); });
  render(<AnalyticsDashboard />);
  const button = screen.getByRole<HTMLButtonElement>("button", { name: "Export CSV" });
  await waitFor(() => expect(button.disabled).toBe(false));
  fireEvent.click(button);
  expect((await screen.findByRole("alert")).textContent).toBe("Unable to export analytics. Please try again.");
  expect(screen.getByRole("region", { name: "Assets by condition" })).toBeTruthy();
  expect(downloads.revoke).toHaveBeenCalledWith("blob:analytics");
  fireEvent.click(button);
  await waitFor(() => expect(downloads.click).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole("alert")).toBeNull();
});

it("writes a UTF-8 BOM and escapes special characters and spreadsheet formulas", async () => {
  const downloads = captureDownloads();
  const { downloadAnalyticsCsv } = await import("../dashboards/AnalyticsDashboard/analyticsCsvExport");
  await downloadAnalyticsCsv({
    ...filtered,
    byDepartment: [{ id: 2, name: '情報, "機器"\n管理', count: 4 }],
    byCondition: [{ id: null, name: "=1+1", count: 4 }]
  });
  const blob = downloads.create.mock.calls[0][0];
  const prefix = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob.slice(0, 3));
  });
  expect([...new Uint8Array(prefix)]).toEqual([0xef, 0xbb, 0xbf]);
  const csv = await readCsv(blob);
  expect(csv).toContain('Department,"情報, ""機器""\n管理",4,100.0%');
  expect(csv).toContain("Condition,'=1+1,4,100.0%");
});

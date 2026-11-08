import type { AssetAnalytics, AssetAnalyticsFilters } from "../../../@types/analytics";
import { ajv } from "../ajv";
import { get } from "./helpers";

const groupSchema = {
  type: "object",
  properties: {
    id: { anyOf: [{ type: "integer" }, { type: "null" }] },
    name: { type: "string" },
    count: { type: "integer", minimum: 0 }
  },
  required: ["id", "name", "count"]
};
const schema = {
  type: "object",
  properties: {
    totalActiveAssets: { type: "integer", minimum: 0 },
    byDepartment: { type: "array", items: groupSchema },
    byDeviceType: { type: "array", items: groupSchema },
    byCondition: { type: "array", items: groupSchema }
  },
  required: ["totalActiveAssets", "byDepartment", "byDeviceType", "byCondition"]
};
const validate = ajv.compile<AssetAnalytics>(schema);

export async function fetchAssetAnalytics(filters: AssetAnalyticsFilters = {}): Promise<AssetAnalytics> {
  const query = new URLSearchParams();
  for (const key of ["departmentId", "deviceTypeId"] as const) {
    const value = filters[key];
    if (value !== undefined) query.set(key, value === null ? "unassigned" : String(value));
  }
  const response = await get(`/analytics/assets${query.size ? `?${query}` : ""}`, validate);
  if (response.status === "success") return response.data;
  throw new Error(response.error.message ?? "Unable to load asset analytics");
}

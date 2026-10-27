import type { AssetAnalytics } from "../../../@types/analytics";
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
    byDeviceType: { type: "array", items: groupSchema }
  },
  required: ["totalActiveAssets", "byDepartment", "byDeviceType"]
};
const validate = ajv.compile<AssetAnalytics>(schema);

export async function fetchAssetAnalytics(): Promise<AssetAnalytics> {
  const response = await get("/analytics/assets", validate);
  if (response.status === "success") return response.data;
  throw new Error(response.error.message ?? "Unable to load asset analytics");
}

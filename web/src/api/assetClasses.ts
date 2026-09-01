import { JSONSchemaType } from "ajv";
import type { AssetClass } from "../../../@types/data";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function fetchAssetClasses() {
  const response = await get("/asset-classes/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function getAllAssetClasses() {
  const response = await get("/asset-classes/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addAssetClass(assetClass: Omit<AssetClass, "AssetClassID">) {
  const response = await post("/asset-classes/add", assetClass, validateEmptyResponse);
  return response.status === "success";
}

export async function updateAssetClass(assetClass: AssetClass) {
  const response = await post(`/asset-classes/${assetClass.AssetClassID}/update`, assetClass, validateEmptyResponse);
  return response.status === "success";
}

export async function deleteAssetClass(assetClassId: number) {
  const response = await post(`/asset-classes/${assetClassId}/delete`, {}, validateEmptyResponse);
  return response.status === "success";
}

export async function restoreAssetClass(assetClassId: number) {
  const response = await post(`/asset-classes/${assetClassId}/restore`, {}, validateEmptyResponse);
  return response.status === "success";
}

const validateResponseSchema: JSONSchemaType<AssetClass[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      AssetClassID: { type: "number" },
      Name: { type: "string" },
      Abbreviation: { type: "string" },
      Deleted: { type: "number", nullable: true }
    },
    required: ["Name", "AssetClassID", "Abbreviation"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);

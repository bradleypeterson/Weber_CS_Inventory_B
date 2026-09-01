import type { ValidateFunction } from "ajv";
import { Asset, AssetDetails, AssetOverview, Note } from "../../../@types/data";
import {
  assetArraySchema,
  assetDetailsArraySchema,
  assetDetailsSchema,
  assetLookupByTagSchema,
  assetOverviewArraySchema,
  conditionArraySchema,
  deviceTypeArraySchema,
  notesSchema
} from "../../../@types/schemas";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function fetchAssetsList(): Promise<Asset[] | undefined> {
  const response = await get("/assets/list", ajv.compile(assetArraySchema));
  if (response.status === "success") return response.data as Asset[];
  return undefined;
}

export async function fetchAssetOverviewList(): Promise<AssetOverview[] | undefined> {
  const response = await get("/assets/list/overview", ajv.compile(assetOverviewArraySchema));
  if (response.status === "success") return response.data as AssetOverview[];
  return undefined;
}

export async function fetchAssetsExport(equipmentIds: number[]): Promise<AssetDetails[] | undefined> {
  const response = await post(
    "/assets/export",
    { equipmentIds },
    ajv.compile(assetDetailsArraySchema)
  );
  if (response.status === "success") return response.data as AssetDetails[];
  return undefined;
}

export async function fetchAssetDetails(assetId: number): Promise<AssetDetails> {
  const response = await get(`/assets/${assetId}`, ajv.compile(assetDetailsSchema));
  if (response.status === "success") return response.data as AssetDetails;
  throw new Error(response.error.message ?? "Unable to load asset details");
}

export async function fetchAssetIdByTagNumber(tagNumber: string): Promise<number> {
  const lookupValidator: ValidateFunction<{ assetId: number }> =
    ajv.compile<{ assetId: number }>(assetLookupByTagSchema) as ValidateFunction<{ assetId: number }>;

  const response = await get<{ assetId: number }>(
    `/assets/lookup/tag/${encodeURIComponent(tagNumber)}`,
    lookupValidator
  );

  if (response.status === "success") return response.data.assetId;
  throw new Error(response.error.message ?? "Unable to find asset by tag number");
}

export async function updateAssetDetails(
  assetId: number,
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const response = await post(`/assets/${assetId}/update`, updates, validateEmptyResponse);
  return response.status === "success";
}

export async function fetchConditions() {
  const response = await get(`/assets/conditions`, ajv.compile(conditionArraySchema));
  if (response.status === "success") return response.data;
  return undefined;
}

export async function fetchDeviceTypes() {
  const response = await get(`/assets/types`, ajv.compile(deviceTypeArraySchema));
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addAsset(
  params: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const response = await post(`/assets/add`, params, validateEmptyResponse);
  return response;
}

export async function fetchAssetNotes(assetId: number): Promise<Note[]> {
  const notesValidator: ValidateFunction<Note[]> = ajv.compile<Note[]>(notesSchema) as ValidateFunction<Note[]>;
  const response = await get<Note[]>(`/assets/${assetId}/notes`, notesValidator);
  if (response.status === "success") return response.data as Note[];
  return [];
}

export async function addNewNote(assetId: number, note: string) {
  const response = await post(`/assets/${assetId}/notes`, { note }, validateEmptyResponse);
  return response;
}

export async function archiveAssets(assetIds: number[]) {
  const response = await post(`/assets/archive`, { assetIds }, validateEmptyResponse);
  return response;
}

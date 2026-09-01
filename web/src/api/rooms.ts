import { JSONSchemaType } from "ajv";
import type { Room } from "../../../@types/data";
import { ajv } from "../ajv";
import { get, post, validateEmptyResponse } from "./helpers";

export async function fetchRooms() {
  const response = await get("/rooms/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function getAllRooms() {
  const response = await get("/rooms/list", validateResponse);
  if (response.status === "success") return response.data;
  return undefined;
}

export async function addRoom(room: Omit<Room, "LocationID">) {
  const response = await post("/rooms/add", room, validateEmptyResponse);
  return response.status === "success";
}

export async function updateRoom(room: Room) {
  const response = await post(`/rooms/${room.LocationID}/update`, room, validateEmptyResponse);
  return response.status === "success";
}

export async function deleteRoom(roomId: number) {
  const response = await post(`/rooms/${roomId}/delete`, {}, validateEmptyResponse);
  return response.status === "success";
}

export async function restoreRoom(roomId: number) {
  const response = await post(`/rooms/${roomId}/restore`, {}, validateEmptyResponse);
  return response.status === "success";
}

const validateResponseSchema: JSONSchemaType<Room[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      LocationID: { type: "number" },
      RoomNumber: { type: "string" },
      BuildingID: { type: "number" },
      Barcode: { type: "string" },
      Deleted: { type: "number", nullable: true }
    },
    required: ["LocationID", "RoomNumber", "BuildingID", "Barcode"]
  }
};

const validateResponse = ajv.compile(validateResponseSchema);
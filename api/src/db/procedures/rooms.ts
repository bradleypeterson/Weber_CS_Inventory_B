import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { Room } from "../../../../@types/data";
import { ROOM_ENTITY_TYPE, formatRoomDeletedNote } from "../../room/roomSystemNotes";
import { addSystemNote } from "./systemNotes";

interface RoomRow extends RowDataPacket, Room {}

export async function getRoomById(id: number): Promise<RoomRow | undefined> {
  try {
    const query = `
      SELECT LocationID, RoomNumber, BuildingID, Barcode
      FROM Location
      WHERE LocationID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;
    const [rows] = await pool.query<RoomRow[]>(query, [id]);
    return rows[0];
  } catch (error) {
    console.error(`Error in getRoomById`, error);
    throw new Error("Failed to fetch room");
  }
}

export async function getAllRooms() {
  try {
    const query = `SELECT LocationID, RoomNumber, BuildingID, Barcode, Deleted FROM Location`;
    const [rows] = await pool.query<RoomRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllRooms`, error);
    throw new Error("An error occurred while getting rooms from database");
  }
}

export async function addRoom(room: Omit<Room, "LocationID">) {
  try {
    const query = `INSERT INTO Location (BuildingID, RoomNumber, Barcode) VALUES (?, ?, ?)`;
    const [result] = await pool.query<ResultSetHeader>(query, [room.BuildingID, room.RoomNumber, room.Barcode]);
    return result.insertId;
  } catch (error) {
    console.error(`Error in addRoom`, error);
    throw new Error("Failed to add room");
  }
}

export async function updateRoom(room: Room) {
  try {
    const query = `UPDATE Location SET BuildingID = ?, RoomNumber = ?, Barcode = ? WHERE LocationID = ?`;
    await pool.query(query, [room.BuildingID, room.RoomNumber, room.Barcode, room.LocationID]);
  } catch (error) {
    console.error(`Error in updateRoom`, error);
    throw new Error("Failed to update room");
  }
}

export async function restoreRoom(id: number, performedByUserId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [snapshotRows] = await connection.query<RoomRow[]>(
      `SELECT LocationID, RoomNumber, BuildingID, Barcode FROM Location WHERE LocationID = ? AND Deleted = 1`,
      [id]
    );
    const snapshot = snapshotRows[0];
    if (!snapshot) {
      await connection.rollback();
      throw new Error("Location not found or not deleted");
    }
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE Location SET Deleted = 0 WHERE LocationID = ? AND Deleted = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Location not found or not deleted");
    }
    const note = `Room Location ID ${snapshot.LocationID} was restored; RoomNumber "${snapshot.RoomNumber}"; BuildingID ${snapshot.BuildingID}; Barcode "${snapshot.Barcode}".`;
    await addSystemNote(ROOM_ENTITY_TYPE, id, note, performedByUserId, "Restored", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in restoreRoom`, error);
    throw new Error("Failed to restore location");
  } finally {
    connection.release();
  }
}

export async function deleteRoom(id: number, performedByUserId: number, snapshot: Room) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE Location SET Deleted = 1 WHERE LocationID = ? AND (Deleted = 0 OR Deleted IS NULL)`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Room not found or already deleted");
    }
    const note = formatRoomDeletedNote(snapshot.LocationID, snapshot.RoomNumber, snapshot.BuildingID, snapshot.Barcode);
    await addSystemNote(ROOM_ENTITY_TYPE, id, note, performedByUserId, "Deleted", connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in deleteRoom`, error);
    throw new Error("Failed to delete room");
  } finally {
    connection.release();
  }
}

interface BuildingIdRow extends RowDataPacket {
  BuildingID: number;
}

interface LocationIdRow extends RowDataPacket {
  LocationID: number;
}

export async function findOrCreateLocationByBuildingAbbrAndRoom(buildingAbbr: string, roomNumber: string) {
  try {
    const normalizedBuildingAbbr = buildingAbbr.trim().toUpperCase();
    const normalizedRoom = roomNumber.trim();
    if (normalizedBuildingAbbr === "" || normalizedRoom === "") {
      return null;
    }

    const [buildingRows] = await pool.query<BuildingIdRow[]>(
      "SELECT BuildingID FROM Building WHERE Abbreviation = ? AND (Deleted = 0 OR Deleted IS NULL) LIMIT 1",
      [normalizedBuildingAbbr]
    );
    if (buildingRows.length === 0) {
      return null;
    }

    const buildingId = buildingRows[0].BuildingID;

    const [locationRows] = await pool.query<LocationIdRow[]>(
      "SELECT LocationID FROM Location WHERE BuildingID = ? AND RoomNumber = ? AND (Deleted = 0 OR Deleted IS NULL) LIMIT 1",
      [buildingId, normalizedRoom]
    );
    if (locationRows.length > 0) {
      return locationRows[0].LocationID;
    }

    const barcode = `${normalizedBuildingAbbr}${normalizedRoom}`;
    const [insertResult] = await pool.query<ResultSetHeader>(
      "INSERT INTO Location (BuildingID, RoomNumber, Barcode) VALUES (?, ?, ?)",
      [buildingId, normalizedRoom, barcode]
    );
    return insertResult.insertId;
  } catch (error) {
    console.error("Error in findOrCreateLocationByBuildingAbbrAndRoom", error);
    throw new Error("An error occurred while finding or creating a location");
  }
}

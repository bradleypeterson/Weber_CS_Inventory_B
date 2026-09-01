import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db";
import { createNewAudit } from "../db/procedures/audits";

interface EquipmentRow extends RowDataPacket {
  EquipmentID: number;
  TagNumber: string;
}

interface ItemNote {
  tagNumber: string;
  note: string;
}

interface AuditSubmission {
  roomId: number | string;
  itemStatuses: Record<string | number, number>;
  itemNotes: ItemNote[];
}

export async function submitAudit(req: Request, res: Response) {
  try {
    const { roomId, itemStatuses = {}, itemNotes = [] } = req.body as AuditSubmission;
    
    // Basic user authentication check
    const user = res.locals.user;
    
    if (!user) {
      return res.status(401).json({ 
        status: "error",
        error: { message: "User not authenticated" }
      });
    }
    
    if (typeof user !== 'object') {
      return res.status(401).json({ 
        status: "error",
        error: { message: "Invalid user data" }
      });
    }
    
    if (!('UserID' in user) || !user.UserID) {
      return res.status(401).json({ 
        status: "error",
        error: { message: "User ID not found" }
      });
    }
    
    // Validate input data
    if (!roomId) {
      return res.status(400).json({
        status: "error",
        error: { message: "Room ID is required" }
      });
    }

    if (!itemStatuses || typeof itemStatuses !== 'object' || Object.keys(itemStatuses).length === 0) {
      return res.status(400).json({
        status: "error",
        error: { message: "Item statuses are required" }
      });
    }

    // Simplify notes handling - create a map of tagNumber -> note for easier lookup
    const notesMap = new Map<string, string>();
    
    // Only process valid item notes
    if (Array.isArray(itemNotes)) {
      itemNotes.forEach(noteItem => {
        if (noteItem && typeof noteItem === 'object' && noteItem.tagNumber && noteItem.note) {
          notesMap.set(String(noteItem.tagNumber), noteItem.note);
        }
      });
    }
    
    // Create a single timestamp for the entire audit session
    const auditTime = new Date();

    // Process each item status and create equipment items array
    const itemEntries = Object.entries(itemStatuses);
    
    // Prepare the array to hold valid equipment items
    const equipmentItems = [];
    
    // First, handle numeric keys (potential equipment IDs) directly
    for (const [key, statusId] of itemEntries) {
      const strKey = String(key);
      const numKey = Number(key);
      const note = notesMap.get(strKey) || "";
      
      // Direct lookup for numeric keys that could be equipment IDs
      if (!isNaN(numKey)) {
        try {
          // Check if this is a valid equipment ID
          const [rows] = await pool.query<EquipmentRow[]>(
            'SELECT EquipmentID, TagNumber FROM Equipment WHERE EquipmentID = ?',
            [numKey]
          );
          
          if (rows.length > 0) {
            equipmentItems.push({
              equipmentId: numKey,
              statusId: Number(statusId),
              note
            });
            continue; // Skip to next item after successful processing
          }
        } catch (error) {
          console.error(`Error looking up equipment ID ${numKey}:`, error);
        }
      }
      
      // If we're here, either the key wasn't numeric or it wasn't a valid equipment ID
      // Try to find by tag number
      try {
        const [rows] = await pool.query<EquipmentRow[]>(
          'SELECT EquipmentID, TagNumber FROM Equipment WHERE TagNumber = ?',
          [strKey]
        );
        
        if (rows.length > 0) {
          const equipmentId = rows[0].EquipmentID;
          
          equipmentItems.push({
            equipmentId,
            statusId: Number(statusId),
            note
          });
        } else {
          console.error(`No equipment found for tag ${strKey}`);
        }
      } catch (error) {
        console.error(`Error looking up equipment tag ${strKey}:`, error);
      }
    }
    
    if (equipmentItems.length === 0) {
      return res.status(400).json({
        status: "error",
        error: { message: "No valid equipment items found for audit" }
      });
    }

    // Create the audit
    await createNewAudit(
      user.UserID,
      Number(roomId),
      equipmentItems,
      auditTime
    );

    res.status(200).json({ 
      status: "success",
      message: "Audit submitted successfully"
    });
  } catch (error) {
    console.error("Error submitting audit:", error);
    res.status(500).json({ 
      status: "error",
      error: { message: `Failed to submit audit: ${error instanceof Error ? error.message : 'Unknown error'}` }
    });
  }
} 
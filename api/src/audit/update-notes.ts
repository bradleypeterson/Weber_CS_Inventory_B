import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { ajv } from "../ajv";
import { validateUser } from "../auth/validateToken";
import { pool } from "../db";

interface ItemNote {
  tagNumber: string;
  note: string;
}

interface EquipmentRow extends RowDataPacket {
  EquipmentID: number;
  TagNumber: string;
}

interface UpdateNotesRequest {
  notes: ItemNote[];
}

const updateNotesSchema: JSONSchemaType<UpdateNotesRequest> = {
  type: "object",
  properties: {
    notes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tagNumber: { type: "string" },
          note: { type: "string" }
        },
        required: ["tagNumber", "note"]
      }
    }
  },
  required: ["notes"]
};

const validateUpdateNotesRequest = ajv.compile(updateNotesSchema);

export async function updateAuditNotes(req: Request, res: Response) {
  try {
    const auditId = Number(req.params.id);
    
    if (isNaN(auditId)) {
      return res.status(400).json({
        status: "error",
        error: { message: "Invalid audit ID" }
      });
    }

    const params: unknown = req.body;
    if (validateUpdateNotesRequest(params) === false) {
      return res.status(400).json({ 
        status: "error", 
        error: { message: "Invalid request body" } 
      });
    }

    const user: unknown = res.locals.user;
    if (validateUser(user) === false) {
      return res.status(401).json({ 
        status: "error", 
        error: { message: "Unauthorized" } 
      });
    }

    // Process notes updates
    const { notes } = params;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // For each note, find the corresponding audit detail record and update it
      for (const note of notes) {
        // First, find the equipment ID for this tag number
        const [equipmentRows] = await connection.query<EquipmentRow[]>(
          'SELECT EquipmentID, TagNumber FROM Equipment WHERE TagNumber = ?',
          [note.tagNumber]
        );

        if (Array.isArray(equipmentRows) && equipmentRows.length > 0) {
          const equipmentId = equipmentRows[0].EquipmentID;
          
          // Update the audit note for this equipment in this audit
          await connection.query(
            'UPDATE AuditDetails SET AuditNote = ? WHERE AuditID = ? AND EquipmentID = ?',
            [note.note, auditId, equipmentId]
          );
        }
      }

      // Commit the transaction
      await connection.commit();
      
      res.json({ 
        status: "success", 
        data: { message: "Audit notes updated successfully" } 
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error("Error in updateAuditNotes transaction:", error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in updateAuditNotes:", error);
    res.status(500).json({ 
      status: "error", 
      error: { message: "Failed to update audit notes" } 
    });
  }
} 
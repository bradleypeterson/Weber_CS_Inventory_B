import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { getUserIDByWNumber } from "../db/procedures/auth";

export async function wNumber(req: Request, res: Response) {
  try {
    const params: unknown = req.query;
    if (!validateParams(params)) {
      res.status(400).json({ status: "error", error: { message: "Invalid request body" } });
      return;
    }

    const userId = await getUserIDByWNumber(params.wNumber);
    if (userId === null) {
      res.status(404).json({ status: "error", error: { message: "User not found" } });
      return;
    }

    res.json({ status: "success", data: { userId } });
  } catch (error) {
    console.error(`Error in UserID endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Internal server error" } });
  }
}

const paramsSchema: JSONSchemaType<{ wNumber: string }> = {
  type: "object",
  properties: {
    wNumber: { type: "string" }
  },
  required: ["wNumber"]
};

const validateParams = ajv.compile(paramsSchema);

const resultData: JSONSchemaType<{ userId: string }> = {
  type: "object",
  properties: {
    userId: { type: "string" }
  },
  required: ["userId"]
};

const validateResult = ajv.compile(resultData);
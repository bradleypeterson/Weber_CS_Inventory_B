import type { JSONSchemaType } from "ajv";
import type { Request, Response } from "express";
import { ajv } from "../ajv";
import { getUserSalt } from "../db/procedures/auth";

export async function salt(req: Request, res: Response) {
  try {
    const params: unknown = req.query;
    if (!validateParams(params)) {
      res.status(400).json({ status: "error", error: { message: "Invalid request body" } });
      return;
    }

    const salt = await getUserSalt(params.userId);
    if (salt === null) {
      res.status(404).json({ status: "error", error: { message: "User not found" } });
      return;
    }

    res.json({ status: "success", data: { salt } });
  } catch (error) {
    console.error(`Error in salt endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Internal server error" } });
  }
}

const paramsSchema: JSONSchemaType<{ userId: string }> = {
  type: "object",
  properties: {
    userId: { type: "string" }
  },
  required: ["userId"]
};

const validateParams = ajv.compile(paramsSchema);

const resultData: JSONSchemaType<{ Salt: string }> = {
  type: "object",
  properties: {
    Salt: { type: "string" }
  },
  required: ["Salt"]
};

const validateResult = ajv.compile(resultData);

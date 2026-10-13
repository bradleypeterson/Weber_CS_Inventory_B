import type { Request, Response } from "express";
import { deleteSession, touchSession } from "../db/procedures/sessions";

export async function activity(_req: Request, res: Response) {
  const user = res.locals.user;
  try {
    if (!await touchSession(user.SessionID, user.UserID)) {
      res.status(401).json({ status: "error", error: { message: "Session expired", code: "SESSION_EXPIRED" } });
      return;
    }
    res.json({ status: "success", data: {} });
  } catch {
    res.status(503).json({ status: "error", error: { message: "Session service unavailable" } });
  }
}

export async function logout(_req: Request, res: Response) {
  const user = res.locals.user;
  try {
    await deleteSession(user.SessionID, user.UserID);
    res.json({ status: "success", data: {} });
  } catch {
    res.status(503).json({ status: "error", error: { message: "Session service unavailable" } });
  }
}

import type { Request, Response } from "express";
import { validateUser } from "../auth/validateToken";
import { getUserAssetRequests } from "../db/procedures/approvalRequests";

export async function myRequests(_req: Request, res: Response) {
  const user: unknown = res.locals.user;

  if (!validateUser(user)) {
    res.status(401).json({ status: "error", error: { message: "Unknown user" } });
    return;
  }

  try {
    const requests = await getUserAssetRequests(user.UserID);
    res.json({ status: "success", data: requests });
  } catch (error) {
    console.error("Error listing user's asset requests:", error);
    res.status(500).json({ status: "error", error: { message: "Could not fetch your asset requests" } });
  }
}
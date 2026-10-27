import { type Request, type Response } from "express";
import { getUserDetails } from "../db/procedures/users";

export async function userDetails(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const user = await getUserDetails(Number(id));
    if (user === undefined) {
      res.status(404).json({ status: "error", error: { message: "User does not exist" } });
      return;
    }
    res.json({ status: "success", data: user });
  } catch (error) {
    console.error(`Error in getUserDetails endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not get user details" } });
  }
}
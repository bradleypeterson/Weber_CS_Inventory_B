import { Router } from "express";
import { sign } from "jsonwebtoken";
import { login } from "./login";
import { salt } from "./salt";
import { updatePassword } from "./updatePassword";
import { validateToken } from "./validateToken";
import { wNumber } from "./wNumber";
export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/salt", salt);
authRouter.get("/wNumber", wNumber);
authRouter.post("/updatePassword", validateToken, updatePassword);

export function createToken(detail: string | object) {
  return sign(detail, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

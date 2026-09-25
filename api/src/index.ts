import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express, { json } from "express";
import morgan from "morgan";
import { assetClassRouter } from "./assetClass";
import { assetRouter } from "./assets";
import { auditRouter } from "./audit";
import { authRouter } from "./auth";
import { validateToken } from "./auth/validateToken";
import { buildingRouter } from "./building";
import { conditionRouter } from "./condition";
import { contactRouter } from "./contacts";
import { departmentRouter } from "./department";
import { deviceTypeRouter } from "./deviceType";
import { fiscalYearsRouter } from "./fiscalYears";
import { importRouter } from "./imports";
import { permissionsRouter } from "./permissions";
import { roomRouter } from "./room";
import { systemNotesRouter } from "./systemNotes";
import { userRouter } from "./users";
config(); // Load environment variables

const app = express();
const port = process.env.PORT;
const JSON_BODY_LIMIT = "10mb";

app.use(json({ limit: JSON_BODY_LIMIT }));
app.use(
  cors({
    credentials: true,
    origin: [
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
      "http://timetracker.users.weber.edu",
      "http://timetracker.users.weber.edu/inventory",
      "http://137.190.19.215"
    ]
  })
);
app.use(
  morgan((tokens, req, res) => {
    const status = tokens.status(req, res);
    return `${tokens.method(req, res)} ${tokens.url(req, res)} ${status}`;
  })
);
app.use(cookieParser());

app.use("/auth", authRouter);

// Routes below this line require the user to be logged in
app.use(validateToken);
app.use("/assets", assetRouter);
app.use("/asset-classes", assetClassRouter);
app.use("/device-types", deviceTypeRouter);
app.use("/conditions", conditionRouter);
app.use("/departments", departmentRouter);
app.use("/permissions", permissionsRouter);
app.use("/contacts", contactRouter);
app.use("/users", userRouter);
app.use("/audits", auditRouter);
app.use("/buildings", buildingRouter);
app.use("/rooms", roomRouter);
app.use("/fiscal-years", fiscalYearsRouter);
app.use("/imports", importRouter);
app.use("/system-notes", systemNotesRouter);

app.listen(port, () => console.log(`Server running on port ${port}`));

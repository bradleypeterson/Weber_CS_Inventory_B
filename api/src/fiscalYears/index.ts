import { Router } from "express";
import { getAllFiscalYears } from "../db/procedures/fiscalYears";
export const fiscalYearsRouter = Router();

fiscalYearsRouter.get("/list", async (req, res) => {
  try {
    const rows = await getAllFiscalYears();
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(`Error in listFiscalYears endpoint:`, error);
    res.status(500).json({ status: "error", error: { message: "Could not list all fiscal years" } });
  }
});

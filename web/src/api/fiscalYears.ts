import type { FiscalYear } from "../../../@types/data";
import { fiscalYearArraySchema } from "../../../@types/schemas";
import { ajv } from "../ajv";
import { get } from "./helpers";

export async function fetchFiscalYears(): Promise<FiscalYear[]> {
  const response = await get<FiscalYear[]>(
    "/fiscal-years/list",
    ajv.compile<FiscalYear[]>(fiscalYearArraySchema) as any
  );
  if (response.status === "success") return response.data as FiscalYear[];
  return [];
}

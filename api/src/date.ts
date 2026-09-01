// Tool for normalizing dates across the backend.
export function normalizeDateForDB(input: string | null | undefined): string | undefined {
  if (!input?.trim()) return undefined;

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date.toISOString().slice(0, 10);
}

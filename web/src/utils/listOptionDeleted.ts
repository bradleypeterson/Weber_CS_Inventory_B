/** Matches list-option API `Deleted` (0/1, boolean, or absent / null for legacy active rows). */
export function isListOptionDeleted(row: { Deleted?: unknown }): boolean {
  const d = row.Deleted;
  return d === 1 || d === true;
}

export function isListOptionActive(row: { Deleted?: unknown }): boolean {
  return !isListOptionDeleted(row);
}

import { useContext } from "react";
import { FilterContext } from "./FilterContext";

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw Error("useFilters must be used within a FilterProvider context");
  return context;
}

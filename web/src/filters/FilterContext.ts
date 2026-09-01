import { createContext } from "react";
import { FilterValues } from "./FilterConfiguration";

export type FilterContextType = {
  filters: FilterValues;
  selectedFilters: FilterValues;
  setFilter: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  selectFilter: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  apply: () => void;
  resetFilters: () => void;
};

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

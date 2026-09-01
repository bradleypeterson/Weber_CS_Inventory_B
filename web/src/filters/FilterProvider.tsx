import { ReactNode, useEffect, useMemo, useState } from "react";
import { useDashboard } from "../navigation/useDashboard";
import { FilterValues } from "./FilterConfiguration";
import { FilterContext } from "./FilterContext";
import { clearPersistedFilters, FILTERS_BY_ROUTE_STORAGE_KEY, LEGACY_FILTERS_STORAGE_KEY } from "./storage";

type FiltersByRoute = Record<string, FilterValues>;

const FALLBACK_ROUTE_KEY = "__global__";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFilterArray(value: unknown): value is Array<string | number> {
  return Array.isArray(value) && value.every((item) => typeof item === "string" || typeof item === "number");
}

function normalizeFilterValues(values: FilterValues): FilterValues {
  const normalized: FilterValues = {};

  for (const [key, rawValue] of Object.entries(values) as [keyof FilterValues, FilterValues[keyof FilterValues]][]) {
    if (!isFilterArray(rawValue)) continue;

    const cleanedValues = rawValue.filter((item) => {
      if (typeof item === "string") return item.trim() !== "";
      return true;
    });

    if (cleanedValues.length > 0) {
      normalized[key] = cleanedValues as never;
    }
  }

  return normalized;
}

function parseFilterValues(raw: unknown): FilterValues | undefined {
  if (!isRecord(raw)) return undefined;

  const parsed: FilterValues = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isFilterArray(value)) continue;
    parsed[key as keyof FilterValues] = value as never;
  }

  return normalizeFilterValues(parsed);
}

function parseFiltersByRoute(raw: unknown): FiltersByRoute | undefined {
  if (!isRecord(raw)) return undefined;

  const parsed: FiltersByRoute = {};
  for (const [routeKey, rawFilters] of Object.entries(raw)) {
    const routeFilters = parseFilterValues(rawFilters);
    if (routeFilters === undefined) continue;
    parsed[routeKey] = routeFilters;
  }

  return parsed;
}

function loadStoredFiltersByRoute(): FiltersByRoute {
  try {
    const routeStored = localStorage.getItem(FILTERS_BY_ROUTE_STORAGE_KEY);
    if (routeStored !== null) {
      const parsed = parseFiltersByRoute(JSON.parse(routeStored));
      if (parsed !== undefined) return parsed;
    }

    // Legacy fallback: older versions stored one shared object under "filters".
    const legacyStored = localStorage.getItem(LEGACY_FILTERS_STORAGE_KEY);
    if (legacyStored !== null) {
      const parsedLegacy = parseFilterValues(JSON.parse(legacyStored));
      if (parsedLegacy !== undefined) return { [FALLBACK_ROUTE_KEY]: parsedLegacy };
    }
  } catch {
    // Ignore corrupted local storage and start from a clean state.
  }

  return {};
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { dashboard } = useDashboard();
  const routeKey = dashboard?.key ?? FALLBACK_ROUTE_KEY;

  const [filtersByRoute, setFiltersByRoute] = useState<FiltersByRoute>({});
  const [selectedFiltersByRoute, setSelectedFiltersByRoute] = useState<FiltersByRoute>({});

  useEffect(function syncPreviousFilter() {
    const storedFiltersByRoute = loadStoredFiltersByRoute();
    setFiltersByRoute(storedFiltersByRoute);
    setSelectedFiltersByRoute(storedFiltersByRoute);
  }, []);

  useEffect(
    function persistFiltersByRoute() {
      const hasSavedFilters = Object.keys(filtersByRoute).length > 0;
      if (hasSavedFilters) {
        localStorage.setItem(FILTERS_BY_ROUTE_STORAGE_KEY, JSON.stringify(filtersByRoute));
        localStorage.removeItem(LEGACY_FILTERS_STORAGE_KEY);
      } else {
        clearPersistedFilters();
      }
    },
    [filtersByRoute]
  );

  const filters = useMemo(() => filtersByRoute[routeKey] ?? {}, [filtersByRoute, routeKey]);
  const selectedFilters = useMemo(
    () => selectedFiltersByRoute[routeKey] ?? filtersByRoute[routeKey] ?? {},
    [selectedFiltersByRoute, filtersByRoute, routeKey]
  );

  function setFilter<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setFiltersByRoute((prev) => {
      const nextRouteFilters = normalizeFilterValues({
        ...(prev[routeKey] ?? {}),
        [key]: value
      });
      return { ...prev, [routeKey]: nextRouteFilters };
    });
  }

  function selectFilter<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setSelectedFiltersByRoute((prev) => {
      const currentRouteSelected = prev[routeKey] ?? filtersByRoute[routeKey] ?? {};
      const nextRouteSelected = normalizeFilterValues({
        ...currentRouteSelected,
        [key]: value
      });
      return { ...prev, [routeKey]: nextRouteSelected };
    });
  }

  function resetFilters() {
    setFiltersByRoute((prev) => {
      const next = { ...prev };
      delete next[routeKey];
      return next;
    });

    setSelectedFiltersByRoute((prev) => {
      const next = { ...prev };
      delete next[routeKey];
      return next;
    });
  }

  function apply() {
    const nextRouteFilters = normalizeFilterValues(selectedFiltersByRoute[routeKey] ?? {});
    const hasSelectedFilters = Object.keys(nextRouteFilters).length > 0;

    if (!hasSelectedFilters) {
      // Consistent behavior: Apply with no active selections clears filters and returns all records for this page.
      resetFilters();
      return;
    }

    setFiltersByRoute((prev) => ({ ...prev, [routeKey]: nextRouteFilters }));
    setSelectedFiltersByRoute((prev) => ({ ...prev, [routeKey]: nextRouteFilters }));
  }

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, selectFilter, apply, selectedFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

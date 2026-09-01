import { useMemo } from "react";
import { useLocation } from "react-router";
import { BuiltDashboard, BuiltTab } from "./types";
import { useAccessibleRoutes } from "./useAccessibleRoutes";

export function useDashboard() {
  const location = useLocation();
  const { routes } = useAccessibleRoutes();

  const dashboard = useMemo(
    () =>
      routes
        .filter((route): route is BuiltDashboard | BuiltTab => ["dashboard", "tab"].includes(route.type))
        .find((route) => route.path === location.pathname),
    [routes, location]
  );

  return { dashboard };
}

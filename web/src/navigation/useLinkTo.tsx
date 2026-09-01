import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { buildPath, getRoutes } from "./useAccessibleRoutes";

export function useLinkTo() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  return useCallback(
    (label: string, parentLabels?: string[], queryParams?: string) => {
      const routes = getRoutes(auth);
      const path = buildPath(label, parentLabels);
      if (routes.some((route) => route.type !== "menu" && route.path === path)) {
        const pathWithParams = `${path}${queryParams ? `?${queryParams}` : ""}`;
        const currentPathWithParams = `${location.pathname}${location.search}`;
        if (currentPathWithParams !== pathWithParams) navigate(pathWithParams);
      } else {
        console.error(`No path found for label: ${label}`);
      }
    },
    [auth, location, navigate]
  );
}

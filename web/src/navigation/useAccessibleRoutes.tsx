import { useMemo } from "react";
import { AuthContextType } from "../context/authContext";
import { useAuth } from "../hooks/useAuth";
import { configuration } from "./Configuration";
import { BuiltDashboard, BuiltFeatures, BuiltPage, BuiltTab, Menu, Page, RouteConfiguration } from "./types";

export function useAccessibleRoutes() {
  const auth = useAuth();
  const routes = useMemo(() => buildAccessibleRoutes(configuration, auth), [auth]);
  if (auth.token === "")
    return {
      routes: buildPageFeature(
        configuration.find((config): config is Page => config.type === "page" && config.label === "Login"),
        auth
      )
    };

  return { routes };
}

export function getRoutes(auth: AuthContextType) {
  return buildAccessibleRoutes(configuration, auth);
}

function buildAccessibleRoutes(configuration: RouteConfiguration, auth: AuthContextType): BuiltFeatures {
  const builtFeatures: BuiltFeatures = [];
  for (const featureItem of configuration) {
    if (featureItem.type === "menu") builtFeatures.push(...buildMenuFeature(featureItem, auth));
    if (featureItem.type === "page") builtFeatures.push(...buildPageFeature(featureItem, auth));
  }

  return builtFeatures;
}

function buildMenuFeature(menu: Menu, auth: AuthContextType) {
  if (!menu.availability(auth) || !menu.menu.some((dashboard) => dashboard.availability(auth))) return [];

  const items: BuiltFeatures = [];
  const dashboards: BuiltDashboard[] = [];
  const tabs: BuiltTab[] = [];

  for (const dashboard of menu.menu) {
    if (!dashboard.availability(auth)) continue;
    const builtDashboard: BuiltDashboard = {
      type: "dashboard",
      label: dashboard.label,
      path: buildPath(dashboard.label, [menu.label]),
      key: buildKey(dashboard.label, [menu.label]),
      element: dashboard.element,
      filters: dashboard.filters
    };

    for (const tab of dashboard.tabs ?? []) {
      const builtTab: BuiltTab = {
        type: "tab",
        label: tab.label,
        path: buildPath(tab.label, [menu.label, dashboard.label]),
        key: buildKey(tab.label, [menu.label, dashboard.label]),
        element: tab.element,
        filters: tab.filters
      };
      items.push(builtTab);
      tabs.push(builtTab);
    }

    items.push(builtDashboard);
    dashboards.push(builtDashboard);
  }

  items.push({
    type: "menu",
    label: menu.label,
    icon: menu.icon,
    key: buildKey(menu.label),
    menu: dashboards
  });

  return items;
}

function buildPageFeature(page: Page | undefined, auth: AuthContextType): BuiltPage[] {
  if (!page || !page.availability(auth)) return [];

  return [
    {
      type: "page",
      path: buildPath(page.label),
      key: buildKey(page.label),
      label: page.label,
      element: page.element
    }
  ];
}

function buildKey(label: string, parentLabels?: string[]) {
  const safeLabel = label.replaceAll(" ", "-").toLowerCase();
  const safeParentLabel = parentLabels?.map((label) => label.replaceAll(" ", "-").toLowerCase());
  return safeParentLabel ? `${safeParentLabel.join("/")}/${safeLabel}` : safeLabel;
}

export function buildPath(label: string, parentLabels?: string[]) {
  const key = buildKey(label, parentLabels);
  return `/${key}`;
}

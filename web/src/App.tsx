import { useMemo } from "react";
import { BrowserRouter, useLocation } from "react-router";
import "./App.css";
import { FilterPanel } from "./components/FilterPanel/FilterPanel";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { AuthProvider } from "./context/AuthProvider";
import { FilterProvider } from "./filters/FilterProvider";
import { useAuth } from "./hooks/useAuth";
import { Router } from "./navigation/Router";
import { BuiltDashboard, BuiltTab } from "./navigation/types";
import { useAccessibleRoutes } from "./navigation/useAccessibleRoutes";

function Layout() {
  const location = useLocation();
  const { token, personID } = useAuth();
  const { routes } = useAccessibleRoutes();
  const dashboardRoutes = useMemo(
    () =>
      new Set(
        routes
          .filter((route): route is BuiltDashboard | BuiltTab => ["dashboard", "tab"].includes(route.type))
          .map((route) => route.path)
      ),
    [routes]
  );

  const showSidebar = useMemo(() => dashboardRoutes.has(location.pathname), [location, dashboardRoutes]);
  const showFilterPanel = useMemo(
    () =>
      routes
        .filter((route): route is BuiltDashboard | BuiltTab => ["dashboard", "tab"].includes(route.type))
        .some(
          (route) =>
            route.path === location.pathname &&
            route.label !== "New Audit" &&
            route.filters !== undefined &&
            route.filters.length > 0
        ),
    [routes, location]
  );

  const classNames = useMemo(() => {
    const names = [];
    if (!showSidebar) names.push("no-sidebar");
    if (showFilterPanel) names.push("show-filter-panel");
    return names;
  }, [showFilterPanel, showSidebar]);

  const filterProviderKey = useMemo(
    () => (token ? `session-${personID}-${token}` : "session-anonymous"),
    [token, personID]
  );

  return (
    <div id="app-layout" className={classNames.join(" ")}>
      <FilterProvider key={filterProviderKey}>
        {showSidebar && <Sidebar />}
        {showFilterPanel && <FilterPanel />}
        <Router />
      </FilterProvider>
    </div>
  );
}

const basePath = import.meta.env.VITE_BASE || "/";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basePath}>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

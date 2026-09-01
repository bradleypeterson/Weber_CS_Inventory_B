import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAccessibleRoutes } from "./useAccessibleRoutes";

export function Router() {
  const { routes } = useAccessibleRoutes();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routes.length > 0) setLoading(false);
  }, [routes]);

  if (loading) return <>Loading</>;
  return (
    <Routes>
      {routes.map(
        (route) => route.type !== "menu" && <Route key={route.key} path={route.path} element={route.element} />
      )}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

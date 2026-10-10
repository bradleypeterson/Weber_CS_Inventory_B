import { Suspense, useEffect, useState } from "react";
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
    <Suspense fallback={<>Loading...</>}>
      <Routes>
        {routes.map(
          (route) => {
            if (route.type === "menu") return null;

            const Component = route.component;

            return <Route key={route.key} path={route.path} element={<Component />} />;
          }
        )}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
}

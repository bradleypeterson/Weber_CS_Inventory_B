import { ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { useQuery } from "react-query";
import { useLocation } from "react-router";
import { fetchUserDetails } from "../../api/users";
import { IconButton } from "../../elements/IconButton/IconButton";
import { MenuItem } from "../../elements/NavbarElements/MenuItem";
import { SubMenuItem } from "../../elements/NavbarElements/SubMenuItem";
import { useAuth } from "../../hooks/useAuth";
import { useAccessibleRoutes } from "../../navigation/useAccessibleRoutes";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { routes } = useAccessibleRoutes();
  const linkTo = useLinkTo();
  const location = useLocation();
  const { personID, token } = useAuth();

  const { data: currentUser } = useQuery(
    ["currentUser", personID],
    () => fetchUserDetails(personID),
    { enabled: Boolean(token) && personID > 0 }
  );

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <h1>SCAM</h1>
      <nav>
        {routes.map(
          (route) =>
            route.type === "menu" && (
              <MenuItem
                key={route.key}
                {...{
                  collapsed,
                  setCollapsed,
                  icon: route.icon,
                  title: route.label === "My Account" ? (currentUser?.Name ?? route.label) : route.label,
                  active: route.menu.some((dashboard) => location.pathname.includes(dashboard.path))
                }}
              >
                {route.menu.map((dashboard) => (
                  <SubMenuItem
                    key={dashboard.key}
                    title={dashboard.label}
                    onClick={() => linkTo(dashboard.label, [route.label])}
                    active={location.pathname.includes(dashboard.path)}
                  />
                ))}
              </MenuItem>
            )
        )}
      </nav>

      <div className={styles.collapseButton}>
        <IconButton
          onClick={() => setCollapsed((cur) => !cur)}
          icon={<ArrowRight style={{ transform: collapsed ? "" : "rotate(180deg)", transition: "0.2s ease-in-out" }} />}
        />
      </div>
    </aside>
  );
}

import { Briefcase, Package, User, UserGear } from "@phosphor-icons/react";
import { PermissionId, hasPermission } from "../../../@types/permissions";
import { AssetsAddDashboard } from "../dashboards/AssetsAddDashboard/AssetsAddDashboard";
import { AssetsDetailsDashboard } from "../dashboards/AssetsDetailsDashboard/AssetsDetailsDashboard";
import { AssetsSearchDashboard } from "../dashboards/AssetsSearchDashboard/AssetsSearchDashboard";
import { AuditDetailsDashboard } from "../dashboards/AuditDetailsDashboard/AuditDetailsDashboard";
import { AuditHistoryDashboard } from "../dashboards/AuditHistoryDashboard/AuditHistoryDashboard";
import { AuditInitiateDashboard } from "../dashboards/AuditInitiateDashboard/AuditInitiateDashboard";
import { AuditSummary } from "../dashboards/AuditInitiateDashboard/AuditSummary";
import { NewAudit } from "../dashboards/AuditInitiateDashboard/NewAudit";
import { ContactDetailsDashboard } from "../dashboards/ContactDetailsDashboard/ContactDetailsDashboard";
import { ContactSearchDashboard } from "../dashboards/ContactSearchDashboard/ContactSearchDashboard";
import { EditListDashboard } from "../dashboards/EditListDashboard/EditListDashboard";
import { ImportDataDashboard } from "../dashboards/ImportDataDashboard/ImportDataDashboard";
import { LandingPage } from "../dashboards/LandingPage/LandingPage";
import { Login } from "../dashboards/Login/Login";
import { Logout } from "../dashboards/Logout/Logout";
import { PasswordChangeDashboard } from "../dashboards/PasswordChangeDashboard/PasswordChangeDashboard";
import { SystemNotesDashboard } from "../dashboards/SystemNotesDashboard/SystemNotesDashboard";
import { UserDetailsDashboard } from "../dashboards/UserDetailsDashboard/UserDetailsDashboard";
import { UserSearchDashboard } from "../dashboards/UserSearchDashboard/UserSearchDashboard";
import { RouteConfiguration } from "./types";

/* 
  Menus are in the sidebar - they have dashboards as children.
  Pages are "outside" the typical flow of the navigation. No sidebar is shown on a page. Think Login / Logout.
*/
export const configuration: RouteConfiguration = [
  {
    type: "menu",
    label: "Assets",
    icon: <Package />,
    menu: [
      {
        type: "dashboard",
        availability: () => true,
        label: "Search",
        element: <AssetsSearchDashboard />,
        filters: ["Department", "Asset Class"]
      },
      { type: "dashboard", availability: () => true, label: "Asset Details", element: <AssetsDetailsDashboard /> },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS),
        label: "Add",
        element: <AssetsAddDashboard />
      }
    ],
    availability: () => true
  },
  {
    type: "menu",
    label: "Audits",
    icon: <Briefcase />,
    menu: [
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS),
        label: "Initiate Audit",
        element: <AuditInitiateDashboard />,
        tabs: [
          {
            type: "tab",
            label: "New Audit",
            element: <NewAudit />,
            //filters: ["Department", "Building", "Room"]
          },
          { type: "tab", label: "Audit Summary", element: <AuditSummary /> }
        ]
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS),
        label: "History",
        element: <AuditHistoryDashboard />,
        filters: ["Date", "Building", "Room", "Auditor", "Status"],
        tabs: [{ type: "tab", label: "Details", element: <AuditDetailsDashboard /> }]
      }
    ],
    availability: () => true
  },
  {
    type: "menu",
    label: "Admin",
    icon: <UserGear />,
    menu: [
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_VIEW_USERS),
        label: "Users",
        element: <UserSearchDashboard />,
        filters: ["Permission", "Department"],
        tabs: [
          { type: "tab", label: "Details", element: <UserDetailsDashboard /> },
          { type: "tab", label: "Change Password", element: <PasswordChangeDashboard /> }
        ]
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_CONTACT_PERSONS),
        label: "Contacts",
        element: <ContactSearchDashboard />,
        filters: ["Department"],
        tabs: [{ type: "tab", label: "Details", filters: ["Department"], element: <ContactDetailsDashboard /> }]
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_LIST_OPTIONS),
        label: "List Options",
        element: <EditListDashboard />
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.IMPORT_CSV_DATA),
        label: "Import Assets",
        element: <ImportDataDashboard />
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_LIST_OPTIONS),
        label: "System Notes",
        element: <SystemNotesDashboard />,
        filters: ["Entity Type", "Date", "Performed By"]
      }
    ],
    availability: () => true
  },
  {
    type: "menu",
    label: "My Account",
    icon: <User />,
    menu: [
      { type: "dashboard", availability: () => true, label: "Change Password", element: <PasswordChangeDashboard /> },
      { type: "dashboard", availability: () => true, label: "Logout", element: <Logout /> }
    ],
    availability: () => true
  },
  {
    type: "page",
    label: "Login",
    element: <Login />,
    availability: () => true
  },
  {
    type: "page",
    label: "Landingpage",
    element: <LandingPage />,
    availability: () => true
  },
  {
    type: "page",
    availability: () => true,
    label: "contactdetails",
    element: <ContactDetailsDashboard />
  },
  {
    type: "page",
    availability: () => true,
    label: "userdetails",
    element: <UserDetailsDashboard />
  },
  {
    type: "page",
    availability: () => true,
    label: "ChangeUserPassword",
    element: <PasswordChangeDashboard />
  }
];

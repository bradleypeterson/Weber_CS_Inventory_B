import { Briefcase, Package, User, UserGear } from "@phosphor-icons/react";
import { lazy } from "react";
import { PermissionId, hasPermission } from "../../../@types/permissions";
import { Login } from "../dashboards/Login/Login";
import { RouteConfiguration } from "./types";
const AssetsAddDashboard = lazy(
  () => import("../dashboards/AssetsAddDashboard/AssetsAddDashboard")
);
const AssetsDetailsDashboard = lazy(
  () => import("../dashboards/AssetsDetailsDashboard/AssetsDetailsDashboard")
);
const AssetsSearchDashboard = lazy(
  () => import("../dashboards/AssetsSearchDashboard/AssetsSearchDashboard")
);
const AuditDetailsDashboard = lazy(
  () => import("../dashboards/AuditDetailsDashboard/AuditDetailsDashboard")
);
const AuditHistoryDashboard = lazy(
  () => import("../dashboards/AuditHistoryDashboard/AuditHistoryDashboard")
);
const AuditInitiateDashboard = lazy(
  () => import("../dashboards/AuditInitiateDashboard/AuditInitiateDashboard")
);
const AuditSummary = lazy(
  () => import("../dashboards/AuditInitiateDashboard/AuditSummary")
);
const NewAudit = lazy(
  () => import("../dashboards/AuditInitiateDashboard/NewAudit")
);
const ContactDetailsDashboard = lazy(
  () => import("../dashboards/ContactDetailsDashboard/ContactDetailsDashboard")
);
const ContactSearchDashboard = lazy(
  () => import("../dashboards/ContactSearchDashboard/ContactSearchDashboard")
);
const EditListDashboard = lazy(
  () => import("../dashboards/EditListDashboard/EditListDashboard")
);
const ImportDataDashboard = lazy(
  () => import("../dashboards/ImportDataDashboard/ImportDataDashboard")
);
const Logout = lazy(
  () => import("../dashboards/Logout/Logout")
);
const PasswordChangeDashboard = lazy(
  () => import("../dashboards/PasswordChangeDashboard/PasswordChangeDashboard")
);
const SystemNotesDashboard = lazy(
  () => import("../dashboards/SystemNotesDashboard/SystemNotesDashboard")
);
const UserDetailsDashboard = lazy(
  () => import("../dashboards/UserDetailsDashboard/UserDetailsDashboard")
);
const UserSearchDashboard = lazy(
  () => import("../dashboards/UserSearchDashboard/UserSearchDashboard")
);


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
        component: AssetsSearchDashboard,
        filters: ["Department", "Asset Class"]
      },
      { type: "dashboard", availability: () => true, label: "Asset Details", component: AssetsDetailsDashboard },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS),
        label: "Add",
        component: AssetsAddDashboard
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
        component: AuditInitiateDashboard,
        tabs: [
          {
            type: "tab",
            label: "New Audit",
            component: NewAudit,
            //filters: ["Department", "Building", "Room"]
          },
          { type: "tab", label: "Audit Summary", component: AuditSummary }
        ]
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS),
        label: "History",
        component: AuditHistoryDashboard,
        filters: ["Date", "Building", "Room", "Auditor", "Status"],
        tabs: [{ type: "tab", label: "Details", component: AuditDetailsDashboard }]
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
        component: UserSearchDashboard,
        filters: ["Permission", "Department"],
        tabs: [
          { type: "tab", label: "Details", component: UserDetailsDashboard },
          { type: "tab", label: "Change Password", component: PasswordChangeDashboard }
        ]
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_CONTACT_PERSONS),
        label: "Contacts",
        component: ContactSearchDashboard,
        filters: ["Department"],
        tabs: [{ type: "tab", label: "Details", filters: ["Department"], component: ContactDetailsDashboard }]
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_LIST_OPTIONS),
        label: "List Options",
        component: EditListDashboard
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.IMPORT_CSV_DATA),
        label: "Import Assets",
        component: ImportDataDashboard
      },
      {
        type: "dashboard",
        availability: ({ permissions }) => hasPermission(permissions, PermissionId.ADD_EDIT_LIST_OPTIONS),
        label: "System Notes",
        component: SystemNotesDashboard,
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
      { type: "dashboard", availability: () => true, label: "Change Password", component: PasswordChangeDashboard },
      { type: "dashboard", availability: () => true, label: "Logout", component: Logout }
    ],
    availability: () => true
  },
  {
    type: "page",
    label: "Login",
    component: Login,
    availability: () => true
  },
  {
    type: "page",
    availability: () => true,
    label: "contactdetails",
    component: ContactDetailsDashboard
  },
  {
    type: "page",
    availability: () => true,
    label: "userdetails",
    component: UserDetailsDashboard
  },
  {
    type: "page",
    availability: () => true,
    label: "ChangeUserPassword",
    component: PasswordChangeDashboard
  }
];

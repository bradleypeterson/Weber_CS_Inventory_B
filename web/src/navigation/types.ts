import { ComponentType, ReactNode } from "react";
import { AuthContextType } from "../context/authContext";
import { FilterValues } from "../filters/FilterConfiguration";

export type RouteConfiguration = FeatureItem[];

export type FeatureItem = Menu | Dashboard | Page;

type FilterName = keyof FilterValues;
export interface FeatureConfigurationBase {
  type: "menu" | "page";
  availability: (auth: AuthContextType) => boolean;
  label: string;
}

export interface Menu extends FeatureConfigurationBase {
  type: "menu";
  icon: ReactNode;
  menu: Dashboard[];
}

export interface Dashboard {
  type: "dashboard";
  availability: (auth: AuthContextType) => boolean;
  label: string;
  component: ComponentType;
  tabs?: Tab[];
  filters?: FilterName[];
}

export interface Page extends FeatureConfigurationBase {
  type: "page";
  label: string;
  component: ComponentType;
}

export interface Tab {
  type: "tab";
  label: string;
  component: ComponentType;
  filters?: FilterName[];
}
export interface BuiltFeatureItemBase {
  type: "menu" | "dashboard" | "page" | "tab";
  key: string;
  label: string;
}

export interface BuiltMenu extends BuiltFeatureItemBase {
  type: "menu";
  icon: ReactNode;
  menu: BuiltDashboard[];
}

export interface BuiltDashboard extends BuiltFeatureItemBase {
  type: "dashboard";
  path: string;
  component: ComponentType;
  filters?: FilterName[];
}

export interface BuiltPage extends BuiltFeatureItemBase {
  type: "page";
  path: string;
  component: ComponentType;
}

export interface BuiltTab extends BuiltFeatureItemBase {
  type: "tab";
  path: string;
  component: ComponentType;
  filters?: FilterName[];
}

export type BuiltFeatureItem = BuiltMenu | BuiltDashboard | BuiltPage | BuiltTab;

export type BuiltFeatures = BuiltFeatureItem[];

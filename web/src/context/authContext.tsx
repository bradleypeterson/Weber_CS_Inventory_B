import { createContext } from "react";

export type AuthContextType = {
  permissions: number[];
  token: string;
  personID: number;
  setPermissions: (permissions: number[]) => void;
  setToken: (token: string) => void;
  setPersonID: (personID: number) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { useMutation, useQuery, useQueryClient } from "react-query";
import type { ContactOverview, FiscalYear, UserOverview } from "../../../@types/data";
import {
  addAssetClass,
  deleteAssetClass,
  getAllAssetClasses,
  restoreAssetClass,
  updateAssetClass
} from "../api/assetClasses";
import { addCondition, deleteCondition, getAllConditions, restoreCondition, updateCondition } from "../api/conditions";
import {
  addDepartment,
  deleteDepartment,
  getAllDepartments,
  restoreDepartment,
  updateDepartment
} from "../api/departments";
import {
  addDeviceType,
  deleteDeviceType,
  getAllDeviceTypes,
  restoreDeviceType,
  updateDeviceType
} from "../api/deviceTypes";
import { addBuilding, deleteBuilding, getAllBuildings, restoreBuilding, updateBuilding } from "../api/buildings";
import { fetchContactList } from "../api/contacts";
import { fetchFiscalYears } from "../api/fiscalYears";
import { addRoom, deleteRoom, getAllRooms, restoreRoom, updateRoom } from "../api/rooms";
import { fetchUserList } from "../api/users";

export function useBuildings() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery("Buildings", getAllBuildings);

  const addMutation = useMutation(addBuilding, {
    onSuccess: () => queryClient.invalidateQueries("Buildings")
  });

  const updateMutation = useMutation(updateBuilding, {
    onSuccess: () => queryClient.invalidateQueries("Buildings")
  });

  const deleteMutation = useMutation(deleteBuilding, {
    onSuccess: () => queryClient.invalidateQueries("Buildings")
  });

  const restoreMutation = useMutation(restoreBuilding, {
    onSuccess: () => queryClient.invalidateQueries("Buildings")
  });

  return {
    data,
    isLoading,
    error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isRestoring: restoreMutation.isLoading,
    refetch
  };
}

export function useRooms() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery("Rooms", getAllRooms);

  const addMutation = useMutation(addRoom, {
    onSuccess: () => queryClient.invalidateQueries("Rooms")
  });

  const updateMutation = useMutation(updateRoom, {
    onSuccess: () => queryClient.invalidateQueries("Rooms")
  });

  const deleteMutation = useMutation(deleteRoom, {
    onSuccess: () => queryClient.invalidateQueries("Rooms")
  });

  const restoreMutation = useMutation(restoreRoom, {
    onSuccess: () => queryClient.invalidateQueries("Rooms")
  });

  return {
    data,
    isLoading,
    error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isRestoring: restoreMutation.isLoading,
    refetch
  };
}

export function useContactPersons() {
  const { data, isLoading } = useQuery("ContactPersons", fetchContactList);
  return { data, isLoading };
}

export function useAssetContactPersons() {
  const { data, isLoading } = useQuery("AssetContactPersons", async () => {
    const [contacts, users] = await Promise.all([fetchContactList(), fetchUserList()]);
    return mergeContactPersonOptions(contacts, users);
  });

  return { data, isLoading };
}

export function useDepartments() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery("departments", getAllDepartments);

  const addMutation = useMutation(addDepartment, {
    onSuccess: () => {
      void queryClient.invalidateQueries("departments");
      void queryClient.invalidateQueries("Departments");
    }
  });

  const updateMutation = useMutation(updateDepartment, {
    onSuccess: () => {
      void queryClient.invalidateQueries("departments");
      void queryClient.invalidateQueries("Departments");
    }
  });

  const deleteMutation = useMutation(deleteDepartment, {
    onSuccess: () => {
      void queryClient.invalidateQueries("departments");
      void queryClient.invalidateQueries("Departments");
    }
  });

  const restoreMutation = useMutation(restoreDepartment, {
    onSuccess: () => {
      void queryClient.invalidateQueries("departments");
      void queryClient.invalidateQueries("Departments");
    }
  });

  return {
    data,
    isLoading,
    error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isRestoring: restoreMutation.isLoading,
    refetch
  };
}

export function useConditions() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery("conditions", getAllConditions);

  const addMutation = useMutation(addCondition, {
    onSuccess: () => queryClient.invalidateQueries("conditions")
  });

  const updateMutation = useMutation(updateCondition, {
    onSuccess: () => queryClient.invalidateQueries("conditions")
  });

  const deleteMutation = useMutation(deleteCondition, {
    onSuccess: () => queryClient.invalidateQueries("conditions")
  });

  const restoreMutation = useMutation(restoreCondition, {
    onSuccess: () => queryClient.invalidateQueries("conditions")
  });

  return {
    data,
    isLoading,
    error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isRestoring: restoreMutation.isLoading,
    refetch
  };
}

export function useAssetClasses() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery("assetClasses", getAllAssetClasses);

  const addMutation = useMutation(addAssetClass, {
    onSuccess: () => {
      void queryClient.invalidateQueries("assetClasses");
      void queryClient.invalidateQueries("Asset Classes");
    }
  });

  const updateMutation = useMutation(updateAssetClass, {
    onSuccess: () => {
      void queryClient.invalidateQueries("assetClasses");
      void queryClient.invalidateQueries("Asset Classes");
    }
  });

  const deleteMutation = useMutation(deleteAssetClass, {
    onSuccess: () => {
      void queryClient.invalidateQueries("assetClasses");
      void queryClient.invalidateQueries("Asset Classes");
    }
  });

  const restoreMutation = useMutation(restoreAssetClass, {
    onSuccess: () => {
      void queryClient.invalidateQueries("assetClasses");
      void queryClient.invalidateQueries("Asset Classes");
    }
  });

  return {
    data,
    isLoading,
    error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isRestoring: restoreMutation.isLoading,
    refetch
  };
}

export function useDeviceTypes() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery("deviceTypes", getAllDeviceTypes);

  const addMutation = useMutation(addDeviceType, {
    onSuccess: () => queryClient.invalidateQueries("deviceTypes")
  });

  const updateMutation = useMutation(updateDeviceType, {
    onSuccess: () => queryClient.invalidateQueries("deviceTypes")
  });

  const deleteMutation = useMutation(deleteDeviceType, {
    onSuccess: () => queryClient.invalidateQueries("deviceTypes")
  });

  const restoreMutation = useMutation(restoreDeviceType, {
    onSuccess: () => queryClient.invalidateQueries("deviceTypes")
  });

  return {
    data,
    isLoading,
    error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isRestoring: restoreMutation.isLoading,
    refetch
  };
}

export function useFiscalYears() {
  const { data = [], isLoading } = useQuery<FiscalYear[]>(["Fiscal Years"], fetchFiscalYears);
  return { data, isLoading };
}

function mergeContactPersonOptions(
  contacts: ContactOverview[] | undefined,
  users: UserOverview[] | undefined
) {
  const peopleById = new Map<number, ContactOverview>();

  for (const contact of contacts ?? []) {
    peopleById.set(contact.PersonID, contact);
  }

  for (const user of users ?? []) {
    if (peopleById.has(user.PersonID)) continue;
    peopleById.set(user.PersonID, {
      PersonID: user.PersonID,
      WNumber: user.WNumber,
      FullName: user.Name,
      Departments: user.Departments,
      Location: user.Location,
      DepartmentID: user.DepartmentID
    });
  }

  return [...peopleById.values()].sort((a, b) => a.FullName.localeCompare(b.FullName));
}

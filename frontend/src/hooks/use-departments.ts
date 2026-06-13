"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from "@/lib/api/departments";
import { dashboardKeys } from "@/lib/dashboard/query-keys";
import { departmentKeys } from "@/lib/departments/query-keys";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "@/lib/departments/types";

import { useAuthToken } from "./use-auth-token";

export function useDepartments() {
  const token = useAuthToken();

  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => listDepartments(token!),
    enabled: Boolean(token),
  });
}

export function useDepartment(departmentId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: departmentKeys.detail(departmentId),
    queryFn: () => getDepartment(token!, departmentId),
    enabled: Boolean(token) && Boolean(departmentId),
  });
}

export function useCreateDepartment() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => createDepartment(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useUpdateDepartment(departmentId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDepartmentInput) =>
      updateDepartment(token!, departmentId, input),
    onSuccess: (department) => {
      queryClient.setQueryData(departmentKeys.detail(departmentId), department);
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useDeleteDepartment() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) => deleteDepartment(token!, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

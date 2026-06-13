"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignPermissionToRole,
  createPermission,
  deletePermission,
  getPermission,
  listPermissions,
  removePermissionFromRole,
  updatePermission,
} from "@/lib/api/permissions";
import { dashboardKeys } from "@/lib/dashboard/query-keys";
import { permissionKeys } from "@/lib/permissions/query-keys";
import type {
  AssignPermissionToRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
} from "@/lib/permissions/types";
import { roleKeys } from "@/lib/roles/query-keys";

import { useAuthToken } from "./use-auth-token";

export function usePermissions() {
  const token = useAuthToken();

  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: () => listPermissions(token!),
    enabled: Boolean(token),
  });
}

export function usePermission(permissionId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: permissionKeys.detail(permissionId),
    queryFn: () => getPermission(token!, permissionId),
    enabled: Boolean(token) && Boolean(permissionId),
  });
}

export function useCreatePermission() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePermissionInput) => createPermission(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useUpdatePermission(permissionId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePermissionInput) =>
      updatePermission(token!, permissionId, input),
    onSuccess: (permission) => {
      queryClient.setQueryData(permissionKeys.detail(permissionId), permission);
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.details() });
    },
  });
}

export function useDeletePermission() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId: string) => deletePermission(token!, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.details() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useAssignPermissionToRole(roleId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignPermissionToRoleInput) =>
      assignPermissionToRole(token!, roleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
      queryClient.invalidateQueries({ queryKey: permissionKeys.roleGrants(roleId) });
    },
  });
}

export function useRemovePermissionFromRole(roleId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId: string) =>
      removePermissionFromRole(token!, roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
      queryClient.invalidateQueries({ queryKey: permissionKeys.roleGrants(roleId) });
    },
  });
}

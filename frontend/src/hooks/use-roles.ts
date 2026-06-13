"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
} from "@/lib/api/roles";
import { dashboardKeys } from "@/lib/dashboard/query-keys";
import { roleKeys } from "@/lib/roles/query-keys";
import type { CreateRoleInput, RoleDetail, UpdateRoleInput } from "@/lib/roles/types";
import { userKeys } from "@/lib/users/query-keys";

import { useAuthToken } from "./use-auth-token";

export function useRoles() {
  const token = useAuthToken();

  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => listRoles(token!),
    enabled: Boolean(token),
  });
}

export function useRole(roleId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => getRole(token!, roleId),
    enabled: Boolean(token) && Boolean(roleId),
  });
}

export function useCreateRole() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => createRole(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useUpdateRole(roleId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRoleInput) => updateRole(token!, roleId, input),
    onSuccess: (role) => {
      queryClient.setQueryData(roleKeys.detail(roleId), (current: RoleDetail | undefined) => {
        if (!current) return current;
        return { ...current, ...role };
      });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useDeleteRole() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteRole(token!, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

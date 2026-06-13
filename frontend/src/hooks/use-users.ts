"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignUserRole,
  getUser,
  listUsers,
  removeUserRole,
  updateUser,
} from "@/lib/api/users";
import { userKeys } from "@/lib/users/query-keys";
import type { AssignRoleInput, UpdateUserInput } from "@/lib/users/types";

import { useAuthToken } from "./use-auth-token";

export function useUsers() {
  const token = useAuthToken();

  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => listUsers(token!),
    enabled: Boolean(token),
  });
}

export function useUser(userId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUser(token!, userId),
    enabled: Boolean(token) && Boolean(userId),
  });
}

export { useRoles } from "./use-roles";

export function useUpdateUser(userId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(token!, userId, input),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(userId), user);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useAssignUserRole(userId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignRoleInput) => assignUserRole(token!, userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useRemoveUserRole(userId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => removeUserRole(token!, userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

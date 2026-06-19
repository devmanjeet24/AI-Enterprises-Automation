"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptUserInvitation,
  assignUserRole,
  createUser,
  getUser,
  inviteUser,
  listUsers,
  listUserInvitations,
  removeUserRole,
  resendUserInvitation,
  updateUser,
} from "@/lib/api/users";
import { dashboardKeys } from "@/lib/dashboard/query-keys";
import { userKeys } from "@/lib/users/query-keys";
import type {
  AcceptInvitationInput,
  AssignRoleInput,
  CreateUserInput,
  InviteUserInput,
  UpdateUserInput,
} from "@/lib/users/types";

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

export function useUserInvitations() {
  const token = useAuthToken();

  return useQuery({
    queryKey: userKeys.invitations(),
    queryFn: () => listUserInvitations(token!),
    enabled: Boolean(token),
  });
}

export { useRoles } from "./use-roles";

export function useCreateUser() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useUpdateUser(userId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(token!, userId, input),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(userId), user);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useInviteUser() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.invitations() });
    },
  });
}

export function useResendUserInvitation() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => resendUserInvitation(token!, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.invitations() });
    },
  });
}

export function useAcceptUserInvitation() {
  return useMutation({
    mutationFn: (input: AcceptInvitationInput) => acceptUserInvitation(input),
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

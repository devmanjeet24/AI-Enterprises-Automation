import { apiClient } from "@/lib/api/client";
import type {
  AssignRoleInput,
  UpdateUserInput,
  User,
  UserRoleAssignment,
} from "@/lib/users/types";

const USERS_BASE = "/api/v1/users";

export function listUsers(token: string): Promise<User[]> {
  return apiClient<User[]>(USERS_BASE, { method: "GET", token });
}

export function getUser(token: string, userId: string): Promise<User> {
  return apiClient<User>(`${USERS_BASE}/${userId}`, { method: "GET", token });
}

export function updateUser(
  token: string,
  userId: string,
  input: UpdateUserInput,
): Promise<User> {
  return apiClient<User>(`${USERS_BASE}/${userId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function assignUserRole(
  token: string,
  userId: string,
  input: AssignRoleInput,
): Promise<UserRoleAssignment> {
  return apiClient<UserRoleAssignment>(`${USERS_BASE}/${userId}/roles`, {
    method: "POST",
    token,
    body: input,
  });
}

export function removeUserRole(
  token: string,
  userId: string,
  roleId: string,
): Promise<void> {
  return apiClient<void>(`${USERS_BASE}/${userId}/roles/${roleId}`, {
    method: "DELETE",
    token,
  });
}

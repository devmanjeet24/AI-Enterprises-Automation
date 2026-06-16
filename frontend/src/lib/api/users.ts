import { apiClient } from "@/lib/api/client";
import { normalizeUser, normalizeUsers } from "@/lib/users/normalize";
import type {
  AssignRoleInput,
  UpdateUserInput,
  User,
  UserRoleAssignment,
} from "@/lib/users/types";

const USERS_BASE = "/api/v1/users";

export async function listUsers(token: string): Promise<User[]> {
  const payload = await apiClient<unknown>(USERS_BASE, { method: "GET", token });
  return normalizeUsers(payload);
}

export async function getUser(token: string, userId: string): Promise<User> {
  const payload = await apiClient<unknown>(`${USERS_BASE}/${userId}`, {
    method: "GET",
    token,
  });
  const user = normalizeUser(payload);
  if (!user) {
    throw new Error("Invalid user response from server.");
  }
  return user;
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

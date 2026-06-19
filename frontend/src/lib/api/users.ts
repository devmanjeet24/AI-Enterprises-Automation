import { apiClient } from "@/lib/api/client";
import { normalizeUser, normalizeUsers } from "@/lib/users/normalize";
import type {
  AcceptInvitationInput,
  AssignRoleInput,
  CreateUserInput,
  InviteUserInput,
  UpdateUserInput,
  User,
  UserInvitation,
  UserRoleAssignment,
} from "@/lib/users/types";
import type { TokenResponse } from "@/lib/api/auth";

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

export function createUser(token: string, input: CreateUserInput): Promise<User> {
  return apiClient<User>(USERS_BASE, {
    method: "POST",
    token,
    body: input,
  });
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

export function listUserInvitations(token: string): Promise<UserInvitation[]> {
  return apiClient<UserInvitation[]>(`${USERS_BASE}/invitations`, {
    method: "GET",
    token,
  });
}

export function inviteUser(
  token: string,
  input: InviteUserInput,
): Promise<UserInvitation> {
  return apiClient<UserInvitation>(`${USERS_BASE}/invitations`, {
    method: "POST",
    token,
    body: input,
  });
}

export function resendUserInvitation(
  token: string,
  invitationId: string,
): Promise<UserInvitation> {
  return apiClient<UserInvitation>(`${USERS_BASE}/invitations/${invitationId}/resend`, {
    method: "POST",
    token,
  });
}

export function acceptUserInvitation(input: AcceptInvitationInput): Promise<TokenResponse> {
  return apiClient<TokenResponse>(`${USERS_BASE}/invitations/accept`, {
    method: "POST",
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

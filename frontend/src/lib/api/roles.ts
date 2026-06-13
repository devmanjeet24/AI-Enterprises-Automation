import { apiClient } from "@/lib/api/client";
import type {
  CreateRoleInput,
  Role,
  RoleDetail,
  UpdateRoleInput,
} from "@/lib/roles/types";

const ROLES_BASE = "/api/v1/roles";

export function listRoles(token: string): Promise<Role[]> {
  return apiClient<Role[]>(ROLES_BASE, { method: "GET", token });
}

export function getRole(token: string, roleId: string): Promise<RoleDetail> {
  return apiClient<RoleDetail>(`${ROLES_BASE}/${roleId}`, { method: "GET", token });
}

export function createRole(token: string, input: CreateRoleInput): Promise<Role> {
  return apiClient<Role>(ROLES_BASE, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updateRole(
  token: string,
  roleId: string,
  input: UpdateRoleInput,
): Promise<Role> {
  return apiClient<Role>(`${ROLES_BASE}/${roleId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}

export function deleteRole(token: string, roleId: string): Promise<void> {
  return apiClient<void>(`${ROLES_BASE}/${roleId}`, { method: "DELETE", token });
}

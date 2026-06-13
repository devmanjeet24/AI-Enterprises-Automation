import { apiClient } from "@/lib/api/client";
import type {
  AssignPermissionToRoleInput,
  CreatePermissionInput,
  Permission,
  RolePermissionGrant,
  UpdatePermissionInput,
} from "@/lib/permissions/types";

const PERMISSIONS_BASE = "/api/v1/permissions";

export function listPermissions(token: string): Promise<Permission[]> {
  return apiClient<Permission[]>(PERMISSIONS_BASE, { method: "GET", token });
}

export function getPermission(token: string, permissionId: string): Promise<Permission> {
  return apiClient<Permission>(`${PERMISSIONS_BASE}/${permissionId}`, {
    method: "GET",
    token,
  });
}

export function createPermission(
  token: string,
  input: CreatePermissionInput,
): Promise<Permission> {
  return apiClient<Permission>(PERMISSIONS_BASE, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updatePermission(
  token: string,
  permissionId: string,
  input: UpdatePermissionInput,
): Promise<Permission> {
  return apiClient<Permission>(`${PERMISSIONS_BASE}/${permissionId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}

export function deletePermission(token: string, permissionId: string): Promise<void> {
  return apiClient<void>(`${PERMISSIONS_BASE}/${permissionId}`, {
    method: "DELETE",
    token,
  });
}

export function listRolePermissionGrants(
  token: string,
  roleId: string,
): Promise<RolePermissionGrant[]> {
  return apiClient<RolePermissionGrant[]>(`${PERMISSIONS_BASE}/roles/${roleId}`, {
    method: "GET",
    token,
  });
}

export function assignPermissionToRole(
  token: string,
  roleId: string,
  input: AssignPermissionToRoleInput,
): Promise<RolePermissionGrant> {
  return apiClient<RolePermissionGrant>(`${PERMISSIONS_BASE}/roles/${roleId}/assign`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function removePermissionFromRole(
  token: string,
  roleId: string,
  permissionId: string,
): Promise<void> {
  return apiClient<void>(
    `${PERMISSIONS_BASE}/roles/${roleId}/assign/${permissionId}`,
    { method: "DELETE", token },
  );
}

export interface Permission {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PermissionStatusFilter = "all" | "active" | "inactive";

export type PermissionResourceFilter = "all" | string;

export interface CreatePermissionInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdatePermissionInput {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface RolePermissionGrant {
  id: string;
  role_id: string;
  permission_id: string;
  permission_slug: string;
  permission_name: string;
  created_at: string;
}

export interface AssignPermissionToRoleInput {
  permission_id: string;
}

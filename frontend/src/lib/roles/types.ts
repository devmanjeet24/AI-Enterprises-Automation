export interface PermissionSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleDetail extends Role {
  permissions: PermissionSummary[];
}

export type RoleStatusFilter = "all" | "active" | "inactive" | "system" | "custom";

export interface CreateRoleInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

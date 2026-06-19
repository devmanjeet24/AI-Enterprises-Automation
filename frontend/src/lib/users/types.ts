export type { Role } from "@/lib/roles/types";

export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: RoleSummary[];
  created_at: string;
  updated_at: string;
}

export type UserStatusFilter = "all" | "active" | "inactive";

export interface UpdateUserInput {
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id?: string;
}

export interface AssignRoleInput {
  role_id: string;
}

export interface InviteUserInput {
  email: string;
  first_name?: string;
  last_name?: string;
  role_id?: string;
}

export interface AcceptInvitationInput {
  token: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UserInvitation {
  id: string;
  organization_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: RoleSummary;
  invited_by_id: string | null;
  accepted_by_id: string | null;
  invite_url: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  role_slug: string;
  role_name: string;
  created_at: string;
}


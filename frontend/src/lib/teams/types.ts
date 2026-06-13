export interface Team {
  id: string;
  organization_id: string;
  department_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TeamStatusFilter = "all" | "active" | "inactive";

export interface CreateTeamInput {
  department_id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateTeamInput {
  department_id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

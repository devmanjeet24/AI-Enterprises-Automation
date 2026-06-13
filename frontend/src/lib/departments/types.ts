export interface Department {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DepartmentStatusFilter = "all" | "active" | "inactive";

export interface CreateDepartmentInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

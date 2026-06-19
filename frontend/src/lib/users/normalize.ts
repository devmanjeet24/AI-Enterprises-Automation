import type { RoleSummary, User } from "@/lib/users/types";

function normalizeRoleSummary(role: unknown): RoleSummary | null {
  if (!role || typeof role !== "object") return null;
  const record = role as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.slug !== "string"
  ) {
    return null;
  }
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
  };
}

export function normalizeUser(user: unknown): User | null {
  if (!user || typeof user !== "object") return null;
  const record = user as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.organization_id !== "string" ||
    typeof record.email !== "string" ||
    typeof record.first_name !== "string" ||
    typeof record.last_name !== "string" ||
    typeof record.is_active !== "boolean" ||
    typeof record.created_at !== "string" ||
    typeof record.updated_at !== "string"
  ) {
    return null;
  }

  const roles = Array.isArray(record.roles)
    ? record.roles
        .map(normalizeRoleSummary)
        .filter((role): role is RoleSummary => role !== null)
    : [];

  return {
    id: record.id,
    organization_id: record.organization_id,
    email: record.email,
    first_name: record.first_name,
    last_name: record.last_name,
    is_active: record.is_active,
    roles,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function normalizeUsers(payload: unknown): User[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map(normalizeUser)
    .filter((user): user is User => user !== null);
}

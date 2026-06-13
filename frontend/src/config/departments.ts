import type { Department, DepartmentStatusFilter } from "@/lib/departments/types";

export type {
  CreateDepartmentInput,
  Department,
  DepartmentStatusFilter,
  UpdateDepartmentInput,
} from "@/lib/departments/types";

export function getDepartmentInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function slugifyDepartmentName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function filterDepartmentsByStatus(
  departments: Department[],
  filter: DepartmentStatusFilter,
): Department[] {
  if (filter === "all") return departments;
  if (filter === "active") return departments.filter((department) => department.is_active);
  return departments.filter((department) => !department.is_active);
}

export function computeDepartmentsStats(departments: Department[]) {
  const active = departments.filter((department) => department.is_active).length;
  return {
    total: departments.length,
    active,
    inactive: departments.length - active,
  };
}

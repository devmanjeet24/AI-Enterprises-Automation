import type { Department } from "@/lib/departments/types";

export function getCreateTeamBlockedMessage(departments: Department[]): string | null {
  const activeDepartments = departments.filter((department) => department.is_active);
  if (activeDepartments.length > 0) return null;
  if (departments.length === 0) {
    return "Create at least one department before adding teams.";
  }
  return "Activate a department before creating teams.";
}

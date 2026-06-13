import type { ResearchProjectDetail } from "@/lib/research-hub/types";

interface RunPermissionContext {
  canExecute: boolean;
  canWrite: boolean;
}

export function getResearchRunBlockedMessage(
  project: ResearchProjectDetail,
  { canExecute, canWrite }: RunPermissionContext,
): string {
  if (!canExecute) {
    return "You do not have permission to execute research projects.";
  }

  if (project.status !== "active") {
    if (project.status === "draft" && !canWrite) {
      return "This project is still in draft. Ask an admin or manager with write access to activate it before you can run research.";
    }
    return "Set project status to active before running research.";
  }

  if (!project.is_active) {
    return "Enable this project to run research.";
  }

  if (!project.research_brief?.trim()) {
    return "Add a research brief in the overview tab before running.";
  }

  return "Research is unavailable for this project.";
}

export function canRunResearchProject(
  project: ResearchProjectDetail,
  canExecute: boolean,
): boolean {
  return (
    canExecute &&
    project.is_active &&
    project.status === "active" &&
    Boolean(project.research_brief?.trim())
  );
}

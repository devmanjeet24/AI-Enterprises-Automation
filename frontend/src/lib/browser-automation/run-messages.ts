import type { BrowserTaskDetail } from "@/lib/browser-automation/types";

interface RunPermissionContext {
  canExecute: boolean;
  canWrite: boolean;
}

export function getBrowserRunBlockedMessage(
  task: BrowserTaskDetail,
  { canExecute, canWrite }: RunPermissionContext,
): string {
  if (!canExecute) {
    return "You do not have permission to execute browser tasks.";
  }

  if (task.status !== "ready") {
    if (task.status === "draft" && !canWrite) {
      return "This task is still in draft. Ask an admin or manager with write access to mark it ready before you can run it.";
    }
    if (task.status === "draft") {
      return "Mark this task as ready in the overview tab before running.";
    }
    if (task.status === "archived") {
      return "Archived tasks cannot be run. Restore the task to ready status first.";
    }
    return "Set task status to ready before running.";
  }

  if (!task.profile_is_active) {
    return "The linked browser profile is inactive. Activate the profile before running.";
  }

  if (!task.target_url?.trim()) {
    return "Add a target URL in the overview tab before running.";
  }

  return "Browser automation is unavailable for this task.";
}

export function canRunBrowserTask(task: BrowserTaskDetail, canExecute: boolean): boolean {
  return (
    canExecute &&
    task.status === "ready" &&
    task.profile_is_active &&
    Boolean(task.target_url?.trim())
  );
}

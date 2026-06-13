import type { BrowserTaskStatus } from "@/lib/browser-automation/types";

export const browserAutomationKeys = {
  all: ["browser-automation"] as const,
  analytics: () => [...browserAutomationKeys.all, "analytics"] as const,
  profiles: () => [...browserAutomationKeys.all, "profiles"] as const,
  profileLists: () => [...browserAutomationKeys.profiles(), "list"] as const,
  profileList: () => [...browserAutomationKeys.profileLists()] as const,
  profileDetails: () => [...browserAutomationKeys.profiles(), "detail"] as const,
  profileDetail: (id: string) => [...browserAutomationKeys.profileDetails(), id] as const,
  tasks: () => [...browserAutomationKeys.all, "tasks"] as const,
  taskLists: () => [...browserAutomationKeys.tasks(), "list"] as const,
  taskList: (profileId?: string) =>
    [...browserAutomationKeys.taskLists(), { profileId: profileId ?? "all" }] as const,
  taskDetails: () => [...browserAutomationKeys.tasks(), "detail"] as const,
  taskDetail: (id: string) => [...browserAutomationKeys.taskDetails(), id] as const,
  executions: () => [...browserAutomationKeys.all, "executions"] as const,
  taskExecutions: (taskId: string) =>
    [...browserAutomationKeys.executions(), "task", taskId] as const,
  orgExecutions: (taskId?: string) =>
    [...browserAutomationKeys.executions(), "org", { taskId: taskId ?? "all" }] as const,
  executionDetail: (id: string) =>
    [...browserAutomationKeys.executions(), "detail", id] as const,
};

export type { BrowserTaskStatus };

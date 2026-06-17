import { browserStepActionLabels, type BrowserStepAction } from "./steps";
import type {
  BrowserExecutionFailedStep,
  BrowserExecutionStepTimelineEntry,
  BrowserTaskExecution,
} from "./types";

export interface BrowserExecutionSummaryItem {
  label: string;
  value: string;
}

export function formatStepDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function getStepActionLabel(action: string): string {
  if (action in browserStepActionLabels) {
    return browserStepActionLabels[action as BrowserStepAction];
  }
  return action;
}

export function getExecutionStepTimeline(
  execution: BrowserTaskExecution,
): BrowserExecutionStepTimelineEntry[] {
  const metadata = execution.execution_metadata;
  const timeline = metadata?.step_timeline;
  if (!Array.isArray(timeline)) return [];
  return timeline.filter(
    (entry): entry is BrowserExecutionStepTimelineEntry =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as BrowserExecutionStepTimelineEntry).index === "number",
  );
}

export function getExecutionFailedStep(
  execution: BrowserTaskExecution,
): BrowserExecutionFailedStep | null {
  const failedStep = execution.execution_metadata?.failed_step;
  if (!failedStep || typeof failedStep !== "object") return null;
  const step = failedStep as BrowserExecutionFailedStep;
  if (typeof step.index !== "number" || typeof step.action !== "string") return null;
  return step;
}

export function formatExecutionErrorMessage(execution: BrowserTaskExecution): string {
  const failedStep = getExecutionFailedStep(execution);
  if (failedStep) {
    const actionLabel = getStepActionLabel(failedStep.action);
    const stepNumber = failedStep.index + 1;
    if (failedStep.selector) {
      return `Step ${stepNumber} (${actionLabel}) failed on "${failedStep.selector}": ${failedStep.message}`;
    }
    return `Step ${stepNumber} (${actionLabel}) failed: ${failedStep.message}`;
  }
  return execution.error_message ?? "The browser automation could not complete this run.";
}

export function buildExecutionSummaryItems(
  execution: BrowserTaskExecution,
): BrowserExecutionSummaryItem[] {
  const result = execution.result ?? {};
  const metadata = execution.execution_metadata ?? {};
  const items: BrowserExecutionSummaryItem[] = [];

  const stepsCompleted =
    typeof result.steps_completed === "number"
      ? result.steps_completed
      : typeof metadata.steps_completed === "number"
        ? metadata.steps_completed
        : null;
  const stepsTotal =
    typeof result.step_count === "number"
      ? result.step_count
      : typeof metadata.steps_total === "number"
        ? metadata.steps_total
        : null;

  if (stepsTotal !== null) {
    items.push({
      label: "Steps",
      value:
        stepsCompleted !== null
          ? `${stepsCompleted} of ${stepsTotal} completed`
          : `${stepsTotal} total`,
    });
  }

  if (typeof result.page_title === "string" && result.page_title) {
    items.push({ label: "Page title", value: result.page_title });
  }

  if (typeof result.final_url === "string" && result.final_url) {
    items.push({ label: "Final URL", value: result.final_url });
  } else if (typeof result.target_url === "string" && result.target_url) {
    items.push({ label: "Target URL", value: result.target_url });
  }

  const extracted = result.extracted;
  if (extracted && typeof extracted === "object" && !Array.isArray(extracted)) {
    const entries = Object.entries(extracted as Record<string, unknown>);
    if (entries.length > 0) {
      items.push({
        label: "Extracted data",
        value: entries
          .map(([key, value]) => `${key}: ${formatExtractedValue(value)}`)
          .join(" · "),
      });
    }
  } else if (typeof result.extracted_text === "string" && result.extracted_text.trim()) {
    const text = result.extracted_text.trim();
    items.push({
      label: "Extracted text",
      value: text.length > 120 ? `${text.slice(0, 119)}…` : text,
    });
  }

  if (typeof metadata.duration_seconds === "number") {
    items.push({
      label: "Duration",
      value: formatStepDuration(Math.round(metadata.duration_seconds * 1000)),
    });
  }

  return items;
}

function formatExtractedValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.map(formatExtractedValue).join(", ");
  return String(value);
}

export function executionHasFailureScreenshot(execution: BrowserTaskExecution): boolean {
  return Boolean(execution.execution_metadata?.has_failure_screenshot);
}

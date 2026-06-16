export type BrowserStepAction =
  | "goto"
  | "wait_for_selector"
  | "click"
  | "fill"
  | "extract";

export interface BrowserExtractSelector {
  name: string;
  selector: string;
  type?: "css" | "xpath";
  multiple?: boolean;
  attribute?: string;
}

export interface BrowserTaskStep {
  action: BrowserStepAction;
  url?: string;
  selector?: string;
  value?: string;
  timeout_ms?: number;
  state?: "attached" | "detached" | "hidden" | "visible";
  selectors?: BrowserExtractSelector[];
}

export const browserStepActionLabels: Record<BrowserStepAction, string> = {
  goto: "Go to URL",
  wait_for_selector: "Wait for selector",
  click: "Click",
  fill: "Fill input",
  extract: "Extract data",
};

export function createEmptyStep(action: BrowserStepAction = "goto"): BrowserTaskStep {
  if (action === "extract") {
    return {
      action,
      selectors: [{ name: "value", selector: "h1", attribute: "text" }],
    };
  }
  if (action === "goto") {
    return { action, url: "{{target_url}}" };
  }
  if (action === "fill") {
    return { action, selector: "", value: "" };
  }
  return { action, selector: "" };
}

export function getStepsFromConfig(
  config: Record<string, unknown> | null | undefined,
): BrowserTaskStep[] {
  const steps = config?.steps;
  if (!Array.isArray(steps)) return [];
  return steps.filter(
    (step): step is BrowserTaskStep =>
      typeof step === "object" &&
      step !== null &&
      typeof (step as BrowserTaskStep).action === "string",
  );
}

export function buildConfigWithSteps(
  config: Record<string, unknown> | null | undefined,
  steps: BrowserTaskStep[],
): Record<string, unknown> {
  const nextConfig = { ...(config ?? {}) };
  if (steps.length > 0) {
    nextConfig.steps = steps;
  } else {
    delete nextConfig.steps;
  }
  return nextConfig;
}

export function validateStepsForSave(steps: BrowserTaskStep[]): string | null {
  if (steps.length === 0) return null;

  const extractIndexes = steps
    .map((step, index) => (step.action === "extract" ? index : -1))
    .filter((index) => index >= 0);

  if (extractIndexes.length > 1) {
    return "Only one extract step is allowed.";
  }
  if (extractIndexes.length === 1 && extractIndexes[0] !== steps.length - 1) {
    return "Extract must be the final step.";
  }

  for (const [index, step] of steps.entries()) {
    if (step.action === "goto") continue;
    if (step.action === "extract") {
      if (!step.selectors?.length) {
        return `Step ${index + 1}: add at least one extract selector.`;
      }
      for (const selector of step.selectors) {
        if (!selector.name.trim() || !selector.selector.trim()) {
          return `Step ${index + 1}: each extract selector needs a name and selector.`;
        }
      }
      continue;
    }
    if (!step.selector?.trim()) {
      return `Step ${index + 1}: selector is required.`;
    }
    if (step.action === "fill" && !step.value?.trim()) {
      return `Step ${index + 1}: fill value is required.`;
    }
  }

  return null;
}

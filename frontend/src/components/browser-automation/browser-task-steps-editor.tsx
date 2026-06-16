"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  browserStepActionLabels,
  createEmptyStep,
  type BrowserExtractSelector,
  type BrowserStepAction,
  type BrowserTaskStep,
} from "@/lib/browser-automation/steps";
import { cn } from "@/lib/utils";

interface BrowserTaskStepsEditorProps {
  steps: BrowserTaskStep[];
  onChange: (steps: BrowserTaskStep[]) => void;
  disabled?: boolean;
}

const actionOptions = Object.entries(browserStepActionLabels) as Array<
  [BrowserStepAction, string]
>;

function updateStep(
  steps: BrowserTaskStep[],
  index: number,
  patch: Partial<BrowserTaskStep>,
): BrowserTaskStep[] {
  return steps.map((step, stepIndex) =>
    stepIndex === index ? { ...step, ...patch } : step,
  );
}

function updateExtractSelector(
  steps: BrowserTaskStep[],
  stepIndex: number,
  selectorIndex: number,
  patch: Partial<BrowserExtractSelector>,
): BrowserTaskStep[] {
  return steps.map((step, currentIndex) => {
    if (currentIndex !== stepIndex || step.action !== "extract") return step;
    const selectors = [...(step.selectors ?? [])];
    selectors[selectorIndex] = { ...selectors[selectorIndex], ...patch };
    return { ...step, selectors };
  });
}

export function BrowserTaskStepsEditor({
  steps,
  onChange,
  disabled = false,
}: BrowserTaskStepsEditorProps) {
  const handleActionChange = (index: number, action: BrowserStepAction) => {
    const nextSteps = [...steps];
    nextSteps[index] = createEmptyStep(action);
    onChange(nextSteps);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const nextSteps = [...steps];
    const [step] = nextSteps.splice(index, 1);
    nextSteps.splice(target, 0, step);
    onChange(nextSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Automation steps</Label>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Steps run in order.             Use <code className="text-foreground">{"{{target_url}}"}</code>{" "}
            in goto steps and <code className="text-foreground">{"{{secrets.*}}"}</code> in fill
            values to reference the task URL.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...steps, createEmptyStep()])}
        >
          <Plus className="size-3.5" />
          Add step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] px-4 py-6 text-center text-[13px] text-muted-foreground">
          No steps configured. The task will use the default pipeline: open target URL and
          extract page text.
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                  Step {index + 1}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled || index === 0}
                    onClick={() => moveStep(index, -1)}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled || index === steps.length - 1}
                    onClick={() => moveStep(index, 1)}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    disabled={disabled}
                    onClick={() => onChange(steps.filter((_, stepIndex) => stepIndex !== index))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`step-action-${index}`}>Action</Label>
                  <select
                    id={`step-action-${index}`}
                    value={step.action}
                    disabled={disabled}
                    onChange={(event) =>
                      handleActionChange(index, event.target.value as BrowserStepAction)
                    }
                    className={cn(
                      "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {actionOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {step.action === "goto" && (
                  <div className="space-y-2">
                    <Label htmlFor={`step-url-${index}`}>URL</Label>
                    <Input
                      id={`step-url-${index}`}
                      value={step.url ?? "{{target_url}}"}
                      disabled={disabled}
                      placeholder="{{target_url}}"
                      onChange={(event) =>
                        onChange(updateStep(steps, index, { url: event.target.value }))
                      }
                    />
                  </div>
                )}

                {(step.action === "wait_for_selector" ||
                  step.action === "click" ||
                  step.action === "fill") && (
                  <div className="space-y-2">
                    <Label htmlFor={`step-selector-${index}`}>Selector</Label>
                    <Input
                      id={`step-selector-${index}`}
                      value={step.selector ?? ""}
                      disabled={disabled}
                      placeholder="input[name='email']"
                      onChange={(event) =>
                        onChange(updateStep(steps, index, { selector: event.target.value }))
                      }
                    />
                  </div>
                )}

                {step.action === "fill" && (
                  <div className="space-y-2">
                    <Label htmlFor={`step-value-${index}`}>Value</Label>
                    <Input
                      id={`step-value-${index}`}
                      value={step.value ?? ""}
                      disabled={disabled}
                      placeholder="Text to type"
                      onChange={(event) =>
                        onChange(updateStep(steps, index, { value: event.target.value }))
                      }
                    />
                  </div>
                )}

                {step.action === "extract" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Extract selectors</Label>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={disabled}
                        onClick={() =>
                          onChange(
                            updateStep(steps, index, {
                              selectors: [
                                ...(step.selectors ?? []),
                                { name: "value", selector: "", attribute: "text" },
                              ],
                            }),
                          )
                        }
                      >
                        <Plus className="size-3.5" />
                        Add selector
                      </Button>
                    </div>

                    {(step.selectors ?? []).map((selector, selectorIndex) => (
                      <div
                        key={selectorIndex}
                        className="grid gap-3 rounded-lg border border-white/[0.06] p-3 sm:grid-cols-2"
                      >
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={selector.name}
                            disabled={disabled}
                            placeholder="field_name"
                            onChange={(event) =>
                              onChange(
                                updateExtractSelector(steps, index, selectorIndex, {
                                  name: event.target.value,
                                }),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Selector</Label>
                          <Input
                            value={selector.selector}
                            disabled={disabled}
                            placeholder="h1, .price, //div[@class='card']"
                            onChange={(event) =>
                              onChange(
                                updateExtractSelector(steps, index, selectorIndex, {
                                  selector: event.target.value,
                                }),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select
                            value={selector.type ?? "css"}
                            disabled={disabled}
                            onChange={(event) =>
                              onChange(
                                updateExtractSelector(steps, index, selectorIndex, {
                                  type: event.target.value as "css" | "xpath",
                                }),
                              )
                            }
                            className={cn(
                              "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                            )}
                          >
                            <option value="css">CSS</option>
                            <option value="xpath">XPath</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Attribute</Label>
                          <Input
                            value={selector.attribute ?? "text"}
                            disabled={disabled}
                            placeholder="text, value, href"
                            onChange={(event) =>
                              onChange(
                                updateExtractSelector(steps, index, selectorIndex, {
                                  attribute: event.target.value,
                                }),
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={disabled || (step.selectors?.length ?? 0) <= 1}
                            onClick={() =>
                              onChange(
                                updateStep(steps, index, {
                                  selectors: (step.selectors ?? []).filter(
                                    (_, currentIndex) => currentIndex !== selectorIndex,
                                  ),
                                }),
                              )
                            }
                          >
                            <Trash2 className="size-3.5" />
                            Remove selector
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

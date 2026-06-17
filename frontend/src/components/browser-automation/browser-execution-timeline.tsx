"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

import {
  formatStepDuration,
  getExecutionStepTimeline,
  getStepActionLabel,
} from "@/lib/browser-automation/execution-helpers";
import type { BrowserTaskExecution } from "@/lib/browser-automation/types";
import { cn } from "@/lib/utils";

interface BrowserExecutionTimelineProps {
  execution: BrowserTaskExecution;
}

function StepStatusIcon({ status }: { status: string }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 text-emerald-400" />;
  }
  if (status === "failed") {
    return <XCircle className="size-4 text-destructive" />;
  }
  if (status === "running") {
    return <Loader2 className="size-4 animate-spin text-brand" />;
  }
  return <Circle className="size-4 text-tertiary" />;
}

export function BrowserExecutionTimeline({ execution }: BrowserExecutionTimelineProps) {
  const timeline = getExecutionStepTimeline(execution);

  if (timeline.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
        Step timeline
      </p>
      <ol className="mt-3 space-y-2">
        {timeline.map((step) => (
          <li
            key={step.index}
            className={cn(
              "rounded-xl border px-4 py-3",
              step.status === "failed"
                ? "border-destructive/20 bg-destructive/5"
                : "border-white/[0.06] bg-white/[0.02]",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <StepStatusIcon status={step.status} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-medium text-tertiary">
                      Step {step.index + 1}
                    </span>
                    <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {getStepActionLabel(step.action)}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium uppercase",
                        step.status === "completed" && "text-emerald-400",
                        step.status === "failed" && "text-destructive",
                        step.status !== "completed" &&
                          step.status !== "failed" &&
                          "text-muted-foreground",
                      )}
                    >
                      {step.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatStepDuration(step.duration_ms)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-foreground">{step.description}</p>
                {step.selector && (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {step.selector}
                  </p>
                )}
                {step.error && (
                  <p className="mt-2 text-[12px] text-destructive">{step.error}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

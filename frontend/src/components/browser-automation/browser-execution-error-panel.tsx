"use client";

import { AlertTriangle } from "lucide-react";

import {
  formatExecutionErrorMessage,
  getExecutionFailedStep,
  getStepActionLabel,
} from "@/lib/browser-automation/execution-helpers";
import type { BrowserTaskExecution } from "@/lib/browser-automation/types";

interface BrowserExecutionErrorPanelProps {
  execution: BrowserTaskExecution;
}

export function BrowserExecutionErrorPanel({ execution }: BrowserExecutionErrorPanelProps) {
  const failedStep = getExecutionFailedStep(execution);
  const message = formatExecutionErrorMessage(execution);

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-destructive">
            Execution failed
          </p>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-foreground">
            {message}
          </p>
          {failedStep && (
            <dl className="mt-3 grid gap-2 rounded-lg border border-destructive/10 bg-black/10 px-3 py-3 text-[12px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Failed step</dt>
                <dd className="font-medium text-foreground">Step {failedStep.index + 1}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Action</dt>
                <dd className="font-medium text-foreground">
                  {getStepActionLabel(failedStep.action)}
                </dd>
              </div>
              {failedStep.selector && (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Selector</dt>
                  <dd className="break-all text-right font-mono text-foreground">
                    {failedStep.selector}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

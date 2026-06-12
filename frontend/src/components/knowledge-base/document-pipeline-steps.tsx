"use client";

import { Check, Circle, Loader2, X } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { pipelineSteps } from "@/config/knowledge-base";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface DocumentPipelineStepsProps {
  document: KnowledgeDocument;
  isProcessing?: boolean;
}

type StepState = "complete" | "current" | "pending" | "failed";

function getStepStates(document: KnowledgeDocument): StepState[] {
  const { status, processed_at, chunk_count, embedded_at } = document;

  if (status === "failed") {
    if (!processed_at) return ["complete", "failed", "pending", "pending"];
    if (chunk_count === 0) return ["complete", "complete", "failed", "pending"];
    return ["complete", "complete", "complete", "failed"];
  }

  if (status === "ready" && embedded_at) {
    return ["complete", "complete", "complete", "complete"];
  }

  if (chunk_count > 0 && !embedded_at) {
    return ["complete", "complete", "complete", "current"];
  }

  if (processed_at && chunk_count === 0) {
    return ["complete", "complete", "current", "pending"];
  }

  if (status === "processing") {
    return ["complete", "current", "pending", "pending"];
  }

  return ["complete", "pending", "pending", "pending"];
}

function StepIcon({ state }: { state: StepState }) {
  const accent = dashboardAccents.purple;

  if (state === "complete") {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
        <Check className="size-4 text-success" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full border",
          accent.bgSubtle,
          accent.border,
        )}
      >
        <Loader2 className={cn("size-4 animate-spin", accent.text)} />
      </div>
    );
  }
  if (state === "failed") {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
        <X className="size-4 text-destructive" />
      </div>
    );
  }
  return (
    <div className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02]">
      <Circle className="size-4 text-tertiary" />
    </div>
  );
}

export function DocumentPipelineSteps({
  document,
  isProcessing = false,
}: DocumentPipelineStepsProps) {
  const stepStates = getStepStates(document);
  const accent = dashboardAccents.purple;

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Processing pipeline
      </p>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Documents must complete all steps before assignment to AI Employees.
      </p>

      <div className="mt-6 flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
        {pipelineSteps.map((step, index) => {
          const state = isProcessing && index === 1 ? "current" : stepStates[index];
          const isLast = index === pipelineSteps.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <div className="flex items-center sm:flex-col">
                <StepIcon state={state} />
                {!isLast && (
                  <div
                    className={cn(
                      "ml-3 h-px w-8 sm:ml-0 sm:mt-3 sm:h-8 sm:w-px",
                      state === "complete"
                        ? "bg-success/40"
                        : "bg-white/[0.08]",
                    )}
                  />
                )}
              </div>
              <div className="min-w-0 pb-6 sm:pb-0">
                <p
                  className={cn(
                    "text-[13px] font-medium",
                    state === "current" ? accent.text : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {document.error_message && (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-[12px] font-medium text-destructive">Processing error</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {document.error_message}
          </p>
        </div>
      )}
    </DashboardCard>
  );
}

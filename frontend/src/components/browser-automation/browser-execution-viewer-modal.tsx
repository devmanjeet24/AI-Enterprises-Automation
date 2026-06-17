"use client";

import { Globe, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { formatDateTime, formatDuration } from "@/config/browser-automation";
import { useBrowserExecution } from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BrowserTaskExecutionSummary } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { BrowserExecutionErrorPanel } from "./browser-execution-error-panel";
import { BrowserExecutionScreenshot } from "./browser-execution-screenshot";
import { BrowserExecutionStatusBadge } from "./browser-execution-status-badge";
import { BrowserExecutionSummary } from "./browser-execution-summary";
import { BrowserExecutionTimeline } from "./browser-execution-timeline";

interface BrowserExecutionViewerModalProps {
  executionSummary: BrowserTaskExecutionSummary | null;
  onClose: () => void;
}

export function BrowserExecutionViewerModal({
  executionSummary,
  onClose,
}: BrowserExecutionViewerModalProps) {
  const accent = dashboardAccents.blue;
  const executionId = executionSummary?.id ?? "";

  const {
    data: execution,
    isLoading,
    isError,
    error,
    refetch,
  } = useBrowserExecution(executionId);

  useEffect(() => {
    if (!executionSummary) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [executionSummary, onClose]);

  if (!executionSummary) return null;

  const duration = formatDuration(
    executionSummary.started_at,
    executionSummary.completed_at,
  );

  const displayExecution = execution ?? null;
  const isInProgress =
    executionSummary.status === "pending" || executionSummary.status === "running";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close execution viewer"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="execution-viewer-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c1220]/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(107,155,248,0.4) 50%, transparent)",
          }}
        />

        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <Globe className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Browser Execution
              </p>
              <h2
                id="execution-viewer-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Execution {executionSummary.id.slice(0, 8)}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BrowserExecutionStatusBadge status={executionSummary.status} />
                <span className="text-[12px] text-muted-foreground">
                  {formatDateTime(executionSummary.created_at)}
                </span>
                {duration && (
                  <span className="text-[12px] text-muted-foreground">
                    Duration: {duration}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading execution…
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
              <p className="text-[14px] font-medium text-foreground">
                Failed to load execution
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {getApiErrorMessage(error, "Could not load this execution.")}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCw className="size-3.5" />
                Try again
              </Button>
            </div>
          )}

          {displayExecution && (
            <div className="space-y-6">
              {isInProgress && (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-brand" />
                  <p className="text-[13px] text-muted-foreground">
                    This execution is still running. Content will refresh automatically.
                  </p>
                </div>
              )}

              {displayExecution.status === "failed" && (
                <BrowserExecutionErrorPanel execution={displayExecution} />
              )}

              <BrowserExecutionSummary execution={displayExecution} />

              <BrowserExecutionTimeline execution={displayExecution} />

              {displayExecution.status === "failed" && (
                <BrowserExecutionScreenshot
                  executionId={displayExecution.id}
                  hasScreenshot={Boolean(
                    displayExecution.execution_metadata?.has_failure_screenshot,
                  )}
                />
              )}

              {displayExecution.logs && displayExecution.logs.length > 0 && (
                <details className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
                  <summary className="cursor-pointer text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Raw logs ({displayExecution.logs.length})
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {displayExecution.logs.map((entry, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-tertiary">
                          {entry.timestamp && (
                            <span>{formatDateTime(entry.timestamp)}</span>
                          )}
                          {entry.level && (
                            <span className="font-medium uppercase text-muted-foreground">
                              {entry.level}
                            </span>
                          )}
                        </div>
                        {entry.message && (
                          <p className="mt-1 text-[12px] leading-relaxed text-foreground">
                            {entry.message}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {!displayExecution.logs?.length &&
                displayExecution.status !== "pending" &&
                displayExecution.status !== "running" &&
                !displayExecution.result &&
                !displayExecution.error_message && (
                  <p className="text-[13px] text-muted-foreground">
                    No additional details recorded for this execution.
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

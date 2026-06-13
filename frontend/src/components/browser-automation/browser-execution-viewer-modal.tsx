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

import { BrowserExecutionStatusBadge } from "./browser-execution-status-badge";

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

          {execution && (
            <div className="space-y-6">
              {(execution.status === "pending" || execution.status === "running") && (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-brand" />
                  <p className="text-[13px] text-muted-foreground">
                    This execution is still running. Content will refresh automatically.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-tertiary">
                  Execution metadata
                </p>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Started</dt>
                    <dd className="font-medium text-foreground">
                      {formatDateTime(execution.started_at)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="font-medium text-foreground">
                      {formatDateTime(execution.completed_at)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-medium text-foreground">
                      {formatDuration(execution.started_at, execution.completed_at) ?? "—"}
                    </dd>
                  </div>
                </dl>
                {execution.execution_metadata &&
                  Object.keys(execution.execution_metadata).length > 0 && (
                    <pre className="mt-4 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/20 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {JSON.stringify(execution.execution_metadata, null, 2)}
                    </pre>
                  )}
              </div>

              {execution.logs && execution.logs.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Logs
                  </p>
                  <ul className="mt-3 space-y-2">
                    {execution.logs.map((entry, index) => (
                      <li
                        key={index}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
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
                          <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                            {entry.message}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {execution.result && Object.keys(execution.result).length > 0 && (
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Result JSON
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 font-mono text-[12px] leading-relaxed text-foreground">
                    {JSON.stringify(execution.result, null, 2)}
                  </pre>
                </div>
              )}

              {execution.error_message && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-destructive">
                    Error
                  </p>
                  <p className="mt-2 text-[13px] text-destructive">{execution.error_message}</p>
                </div>
              )}

              {!execution.logs?.length &&
                !execution.result &&
                !execution.error_message &&
                execution.status !== "pending" &&
                execution.status !== "running" && (
                  <p className="text-[13px] text-muted-foreground">
                    No logs or results recorded for this execution.
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

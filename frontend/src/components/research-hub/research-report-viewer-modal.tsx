"use client";

import { FileDown, FileText, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";

import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { Button } from "@/components/ui/button";
import {
  useExportResearchReportMarkdown,
  useExportResearchReportPdf,
  useResearchReport,
} from "@/hooks/use-research-projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ResearchReportSummary } from "@/lib/research-hub/types";
import { formatDateTime } from "@/config/research-hub";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface ResearchReportViewerModalProps {
  projectId: string;
  reportSummary: ResearchReportSummary | null;
  onClose: () => void;
}

export function ResearchReportViewerModal({
  projectId,
  reportSummary,
  onClose,
}: ResearchReportViewerModalProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const reportId = reportSummary?.id ?? "";

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useResearchReport(projectId, reportId);

  const exportMarkdown = useExportResearchReportMarkdown(projectId, reportId);
  const exportPdf = useExportResearchReportPdf(projectId, reportId);

  const canExport =
    report?.status === "completed" && Boolean(report.final_output?.trim());

  useEffect(() => {
    if (!reportSummary) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [reportSummary, onClose]);

  const handleExportMarkdown = async () => {
    try {
      await exportMarkdown.mutateAsync();
      toast.success("Markdown report downloaded.");
    } catch (exportError) {
      toast.error(getApiErrorMessage(exportError, "Failed to export Markdown report."));
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportPdf.mutateAsync();
      toast.success("PDF report downloaded.");
    } catch (exportError) {
      toast.error(getApiErrorMessage(exportError, "Failed to export PDF report."));
    }
  };

  const isExporting = exportMarkdown.isPending || exportPdf.isPending;

  if (!reportSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close report viewer"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-viewer-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c1220]/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(167,139,250,0.4) 50%, transparent)",
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
              <FileText className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Research Report
              </p>
              <h2
                id="report-viewer-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Version {reportSummary.version_number}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={reportSummary.status} />
                <span className="text-[12px] text-muted-foreground">
                  {formatDateTime(reportSummary.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canExport && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExportMarkdown}
                >
                  {exportMarkdown.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileDown className="size-3.5" />
                  )}
                  Markdown
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExportPdf}
                >
                  {exportPdf.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileDown className="size-3.5" />
                  )}
                  PDF
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading report…
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
              <p className="text-[14px] font-medium text-foreground">
                Failed to load report
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {getApiErrorMessage(error, "Could not load this report.")}
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

          {report && (
            <div className="space-y-6">
              {(report.status === "pending" || report.status === "in_progress") && (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-brand" />
                  <p className="text-[13px] text-muted-foreground">
                    This report is still running. Content will refresh automatically.
                  </p>
                </div>
              )}

              {!canExport && report.status === "completed" && (
                <p className="text-[12px] text-muted-foreground">
                  Export is available once a final output is generated.
                </p>
              )}

              {!canExport && report.status !== "completed" && report.status !== "pending" && report.status !== "in_progress" && (
                <p className="text-[12px] text-muted-foreground">
                  Export is available for completed reports with output.
                </p>
              )}

              {report.final_output ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Final report
                  </p>
                  <div className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                    {report.final_output}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  No final output available for this report.
                </p>
              )}

              {report.error_message && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-destructive">
                    Error
                  </p>
                  <p className="mt-2 text-[13px] text-destructive">{report.error_message}</p>
                </div>
              )}

              {report.intermediate_outputs && report.intermediate_outputs.length > 0 && (
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                    Step outputs
                  </p>
                  <ul className="mt-3 space-y-2">
                    {report.intermediate_outputs.map((step, index) => (
                      <li
                        key={index}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-foreground">
                            Step {(step.sequence_order ?? index) + 1}
                          </p>
                          {step.status && (
                            <span className="text-[11px] text-muted-foreground">
                              {step.status}
                            </span>
                          )}
                        </div>
                        {step.output && (
                          <p className="mt-2 line-clamp-4 text-[12px] leading-relaxed text-muted-foreground">
                            {step.output}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

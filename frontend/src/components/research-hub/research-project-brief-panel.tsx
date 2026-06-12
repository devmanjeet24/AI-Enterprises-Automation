"use client";

import { FileText, Layers, Loader2, Network, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  researchTemplateLabels,
} from "@/config/research-hub";
import {
  useResearchTemplates,
  useUpdateResearchProject,
} from "@/hooks/use-research-projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  ResearchProjectDetail,
  ResearchProjectStatus,
} from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface ResearchProjectBriefPanelProps {
  project: ResearchProjectDetail;
  canWrite?: boolean;
}

const statusOptions: { value: ResearchProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export function ResearchProjectBriefPanel({
  project,
  canWrite = true,
}: ResearchProjectBriefPanelProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const updateMutation = useUpdateResearchProject(project.id);
  const { data: templates = [] } = useResearchTemplates();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [researchBrief, setResearchBrief] = useState(project.research_brief ?? "");
  const [status, setStatus] = useState(project.status);
  const [isActive, setIsActive] = useState(project.is_active);
  const [hasChanges, setHasChanges] = useState(false);

  const template = templates.find((item) => item.template_type === project.template_type);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
    setResearchBrief(project.research_brief ?? "");
    setStatus(project.status);
    setIsActive(project.is_active);
    setHasChanges(false);
  }, [
    project.id,
    project.name,
    project.description,
    project.research_brief,
    project.status,
    project.is_active,
    project.updated_at,
  ]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        research_brief: researchBrief.trim(),
        status,
        is_active: isActive,
      });
      toast.success("Project configuration saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save project configuration."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Project details
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update project metadata, research brief, and lifecycle status.
            </p>
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              disabled={!hasChanges || isSaving || !researchBrief.trim()}
              onClick={handleSave}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </Button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-config-name">Name</Label>
            <Input
              id="project-config-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-config-description">Description</Label>
            <textarea
              id="project-config-description"
              rows={2}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional project description"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-config-brief">Research brief</Label>
            <textarea
              id="project-config-brief"
              rows={6}
              value={researchBrief}
              onChange={(e) => {
                setResearchBrief(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Research goals, scope, audience, and key questions…"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          {canWrite ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-config-status">Status</Label>
                  <select
                    id="project-config-status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as ResearchProjectStatus);
                      markChanged();
                    }}
                    disabled={isSaving}
                    className={cn(
                      "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-config-active">Enabled</Label>
                  <select
                    id="project-config-active"
                    value={isActive ? "true" : "false"}
                    onChange={(e) => {
                      setIsActive(e.target.value === "true");
                      markChanged();
                    }}
                    disabled={isSaving}
                    className={cn(
                      "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              You have read-only access. Contact an admin to edit this project.
            </p>
          )}
        </div>
      </DashboardCard>

      <div className="space-y-6">
        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <FileText className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Methodology template
            </p>
          </div>
          <div className="mt-4">
            <p className="text-[15px] font-medium text-foreground">
              {researchTemplateLabels[project.template_type]}
            </p>
            {template?.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            )}
          </div>
          {template && template.steps.length > 0 && (
            <ol className="mt-5 space-y-2">
              {template.steps.map((step) => (
                <li
                  key={step.sequence_order}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold",
                      accent.border,
                      accent.text,
                    )}
                  >
                    {step.sequence_order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{step.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </DashboardCard>

        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Network className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Assigned agent team
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Team</dt>
              <dd>
                <Link
                  href={`/agent-teams/${project.agent_team_id}`}
                  className="font-medium text-foreground hover:text-brand"
                >
                  {project.agent_team_name}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(project.created_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(project.updated_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Runnable</dt>
              <dd className="font-medium text-foreground">
                {project.is_active &&
                project.status === "active" &&
                Boolean(project.research_brief?.trim())
                  ? "Yes"
                  : "No"}
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Layers className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Research summary
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Template</dt>
              <dd className="font-medium text-foreground">
                {researchTemplateLabels[project.template_type]}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Brief length</dt>
              <dd className="font-medium text-foreground">
                {(project.research_brief ?? "").length} chars
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Pipeline steps</dt>
              <dd className="font-medium text-foreground">
                {template?.steps.length ?? "—"}
              </dd>
            </div>
          </dl>
        </DashboardCard>
      </div>
    </div>
  );
}

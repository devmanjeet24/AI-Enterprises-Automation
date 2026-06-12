"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useAssignableAgentTeams,
  useUpdateWorkflow,
} from "@/hooks/use-workflows";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { WorkflowDetail, WorkflowStatus } from "@/lib/workflows/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface WorkflowConfigPanelProps {
  workflow: WorkflowDetail;
  canWrite?: boolean;
}

const statusOptions: { value: WorkflowStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export function WorkflowConfigPanel({
  workflow,
  canWrite = true,
}: WorkflowConfigPanelProps) {
  const toast = useToast();
  const updateMutation = useUpdateWorkflow(workflow.id);
  const { data: assignableTeams = [], isLoading: isLoadingTeams } =
    useAssignableAgentTeams();

  const [name, setName] = useState(workflow.name);
  const [slug, setSlug] = useState(workflow.slug);
  const [description, setDescription] = useState(workflow.description ?? "");
  const [agentTeamId, setAgentTeamId] = useState(workflow.agent_team_id);
  const [status, setStatus] = useState(workflow.status);
  const [isActive, setIsActive] = useState(workflow.is_active);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(workflow.name);
    setSlug(workflow.slug);
    setDescription(workflow.description ?? "");
    setAgentTeamId(workflow.agent_team_id);
    setStatus(workflow.status);
    setIsActive(workflow.is_active);
    setHasChanges(false);
  }, [
    workflow.id,
    workflow.name,
    workflow.slug,
    workflow.description,
    workflow.agent_team_id,
    workflow.status,
    workflow.is_active,
    workflow.updated_at,
  ]);

  const markChanged = () => setHasChanges(true);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        agent_team_id: agentTeamId,
        status,
        is_active: isActive,
      });
      toast.success("Workflow configuration saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save workflow configuration."));
    }
  };

  const availableTeams = assignableTeams.filter((team) => team.is_active);
  const isSaving = updateMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Workflow configuration
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Update workflow metadata, agent team, and lifecycle status.
          </p>
        </div>
        {canWrite && (
          <Button
            variant="brand"
            size="sm"
            disabled={!hasChanges || isSaving}
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
          <Label htmlFor="wf-config-name">Name</Label>
          <Input
            id="wf-config-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markChanged();
            }}
            disabled={isSaving || !canWrite}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wf-config-slug">Slug</Label>
          <Input
            id="wf-config-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              markChanged();
            }}
            disabled={isSaving || !canWrite}
            className="font-mono text-[13px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wf-config-team">Agent Team</Label>
          <select
            id="wf-config-team"
            value={agentTeamId}
            onChange={(e) => {
              setAgentTeamId(e.target.value);
              markChanged();
            }}
            disabled={isSaving || !canWrite || isLoadingTeams}
            className={cn(
              "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
                {team.member_count > 0
                  ? ` — ${team.member_count} member${team.member_count === 1 ? "" : "s"}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wf-config-description">Description</Label>
          <textarea
            id="wf-config-description"
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markChanged();
            }}
            disabled={isSaving || !canWrite}
            className={cn(
              "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
              "placeholder:text-tertiary",
              "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wf-config-status">Status</Label>
          <select
            id="wf-config-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as WorkflowStatus);
              markChanged();
            }}
            disabled={isSaving || !canWrite}
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

        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-[14px] font-medium text-foreground">Workflow enabled</p>
            <p className="text-[12px] text-muted-foreground">
              Disabled workflows cannot be executed
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsActive((prev) => !prev);
              markChanged();
            }}
            disabled={isSaving || !canWrite}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
              !canWrite && "cursor-not-allowed opacity-60",
              isActive
                ? "border-success/40 bg-success/20"
                : "border-white/[0.12] bg-white/[0.04]",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                isActive ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}

"use client";

import { GitBranch, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyWorkflowName } from "@/config/workflows";
import {
  useAssignableAgentTeams,
  useCreateWorkflow,
} from "@/hooks/use-workflows";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface CreateWorkflowModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkflowModal({ open, onClose }: CreateWorkflowModalProps) {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateWorkflow();
  const { data: assignableTeams = [], isLoading: isLoadingTeams } =
    useAssignableAgentTeams();

  const accent = dashboardAccents.purple;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [agentTeamId, setAgentTeamId] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const availableTeams = assignableTeams.filter(
    (team) => team.is_active && team.member_count > 0,
  );

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setDescription("");
    setAgentTeamId("");
    setSlugTouched(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createMutation.isPending) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, createMutation.isPending]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugifyWorkflowName(name));
    }
  }, [name, slugTouched]);

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    await runMutationWithFeedback({
      action: () =>
        createMutation.mutateAsync({
          name: name.trim(),
          slug: slug.trim() || slugifyWorkflowName(name),
          description: description.trim() || undefined,
          agent_team_id: agentTeamId,
          steps: [
            {
              name: "Step 1",
              description: "Define this step in the workflow builder.",
              sequence_order: 0,
            },
          ],
        }),
      toast,
      successMessage: (workflow) => `Workflow "${workflow.name}" created successfully.`,
      errorFallback: "Failed to create workflow.",
      onSuccess: (workflow) => {
        resetForm();
        onClose();
        router.push(`/workflows/${workflow.id}`);
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close create workflow modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={createMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workflow-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0c1220]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(167,139,250,0.4) 50%, transparent)",
          }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <GitBranch className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Workflow Automation
              </p>
              <h2
                id="create-workflow-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Create workflow
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Workflows start as draft. Add steps in the builder after creation.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="e.g. Q2 Report Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-slug">Slug</Label>
            <Input
              id="workflow-slug"
              placeholder="q2-report-pipeline"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              disabled={createMutation.isPending}
              className="font-mono text-[13px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-team">Agent Team</Label>
            <select
              id="workflow-team"
              value={agentTeamId}
              onChange={(e) => setAgentTeamId(e.target.value)}
              disabled={createMutation.isPending || isLoadingTeams}
              className={cn(
                "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">
                {isLoadingTeams ? "Loading teams…" : "Select agent team…"}
              </option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} — {team.member_count} member
                  {team.member_count === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-tertiary">
              Must be an active team with at least one member.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description (optional)</Label>
            <textarea
              id="workflow-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="What does this workflow automate?"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled={
              !name.trim() ||
              !agentTeamId ||
              createMutation.isPending ||
              availableTeams.length === 0
            }
            onClick={handleCreate}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {createMutation.isPending ? "Creating…" : "Create workflow"}
          </Button>
        </div>
      </div>
    </div>
  );
}

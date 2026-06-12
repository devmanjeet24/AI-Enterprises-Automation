"use client";

import { GripVertical, Layers, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { stepsToDraft, useUpdateWorkflow } from "@/hooks/use-workflows";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { WorkflowDetail, WorkflowStep } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface WorkflowBuilderProps {
  workflow: WorkflowDetail;
  canWrite?: boolean;
}

export function WorkflowBuilder({ workflow, canWrite = true }: WorkflowBuilderProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const updateMutation = useUpdateWorkflow(workflow.id);

  const [steps, setSteps] = useState<WorkflowStep[]>(
    [...workflow.steps].sort((a, b) => a.sequence_order - b.sequence_order),
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [stepName, setStepName] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepPrompt, setStepPrompt] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSteps(
      [...workflow.steps].sort((a, b) => a.sequence_order - b.sequence_order),
    );
    setHasChanges(false);
  }, [workflow.id, workflow.steps, workflow.updated_at]);

  const handleAddStep = () => {
    if (!stepName.trim()) return;

    const nextOrder =
      steps.length > 0 ? Math.max(...steps.map((step) => step.sequence_order)) + 1 : 0;

    const newStep: WorkflowStep = {
      id: `step-new-${Date.now()}`,
      workflow_id: workflow.id,
      name: stepName.trim(),
      description: stepDescription.trim() || null,
      sequence_order: nextOrder,
      config: stepPrompt.trim() ? { prompt: stepPrompt.trim() } : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSteps((prev) => [...prev, newStep]);
    setStepName("");
    setStepDescription("");
    setStepPrompt("");
    setShowAddForm(false);
    setHasChanges(true);
  };

  const handleRemove = (stepId: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (steps.length === 0) {
      toast.error("Workflow must have at least one step.");
      return;
    }

    try {
      await updateMutation.mutateAsync({ steps: stepsToDraft(steps) });
      toast.success("Workflow steps saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save workflow steps."));
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-6">
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Workflow builder
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Define ordered steps that map to agent team member sequence. Each step
              can include a custom prompt in config.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {canWrite && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="size-3.5" />
                  Add step
                </Button>
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
                  Save steps
                </Button>
              </>
            )}
          </div>
        </div>

        {showAddForm && (
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[13px] font-medium text-foreground">Add workflow step</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="step-name">Step name</Label>
                <Input
                  id="step-name"
                  placeholder="e.g. Research"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="step-description">Description</Label>
                <Input
                  id="step-description"
                  placeholder="What should this step accomplish?"
                  value={stepDescription}
                  onChange={(e) => setStepDescription(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="step-prompt">Custom prompt (optional)</Label>
                <textarea
                  id="step-prompt"
                  rows={2}
                  value={stepPrompt}
                  onChange={(e) => setStepPrompt(e.target.value)}
                  disabled={isSaving}
                  placeholder="Overrides default step prompt at execution time"
                  className={cn(
                    "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground",
                    "placeholder:text-tertiary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  )}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="sm"
                disabled={!stepName.trim() || isSaving}
                onClick={handleAddStep}
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>
          </div>
        )}

        {steps.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
            <Layers className="mx-auto size-8 text-tertiary" />
            <p className="mt-3 text-[14px] font-medium text-foreground">No steps yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Add at least one step. Step order must match agent team member order.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <GripVertical className="mt-1 size-4 shrink-0 text-tertiary" />
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold",
                    accent.border,
                    accent.text,
                  )}
                >
                  {step.sequence_order + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-foreground">{step.name}</p>
                  {step.description && (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                  {typeof step.config?.prompt === "string" && step.config.prompt && (
                    <p className="mt-2 line-clamp-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px] text-tertiary">
                      prompt: {step.config.prompt}
                    </p>
                  )}
                </div>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isSaving}
                    onClick={() => handleRemove(step.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {steps.length > 0 && (
          <p className="mt-4 text-[12px] text-tertiary">
            Steps execute in sequence order, aligned with agent team members at run time.
          </p>
        )}
      </DashboardCard>
    </div>
  );
}

"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useUpdateAgentTeam } from "@/hooks/use-agent-teams";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AgentTeamDetail } from "@/lib/agent-teams/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface TeamConfigPanelProps {
  team: AgentTeamDetail;
  canWrite?: boolean;
}

export function TeamConfigPanel({ team, canWrite = true }: TeamConfigPanelProps) {
  const toast = useToast();
  const updateMutation = useUpdateAgentTeam(team.id);
  const [name, setName] = useState(team.name);
  const [slug, setSlug] = useState(team.slug);
  const [description, setDescription] = useState(team.description ?? "");
  const [isActive, setIsActive] = useState(team.is_active);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(team.name);
    setSlug(team.slug);
    setDescription(team.description ?? "");
    setIsActive(team.is_active);
    setHasChanges(false);
  }, [team.id, team.name, team.slug, team.description, team.is_active, team.updated_at]);

  const markChanged = () => setHasChanges(true);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        is_active: isActive,
      });
      toast.success("Team configuration saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save team configuration."));
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Team configuration
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Update team name, slug, description, and activation status.
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
          <Label htmlFor="config-name">Name</Label>
          <Input
            id="config-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markChanged();
            }}
            disabled={isSaving || !canWrite}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="config-slug">Slug</Label>
          <Input
            id="config-slug"
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
          <Label htmlFor="config-description">Description</Label>
          <textarea
            id="config-description"
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

        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-[14px] font-medium text-foreground">Team active</p>
            <p className="text-[12px] text-muted-foreground">
              Inactive teams cannot submit or run tasks
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

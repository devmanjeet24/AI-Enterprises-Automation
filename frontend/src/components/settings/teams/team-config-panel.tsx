"use client";

import { Calendar, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/teams";
import { useDepartments } from "@/hooks/use-departments";
import { useUpdateTeam } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Team } from "@/lib/teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface TeamConfigPanelProps {
  team: Team;
  canWrite?: boolean;
}

export function TeamConfigPanel({ team, canWrite = true }: TeamConfigPanelProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const updateMutation = useUpdateTeam(team.id);
  const { data: departments = [] } = useDepartments();

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active || department.id === team.department_id),
    [departments, team.department_id],
  );

  const [name, setName] = useState(team.name);
  const [slug, setSlug] = useState(team.slug);
  const [description, setDescription] = useState(team.description ?? "");
  const [departmentId, setDepartmentId] = useState(team.department_id);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(team.name);
    setSlug(team.slug);
    setDescription(team.description ?? "");
    setDepartmentId(team.department_id);
    setHasChanges(false);
  }, [
    team.id,
    team.name,
    team.slug,
    team.description,
    team.department_id,
    team.updated_at,
  ]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        department_id: departmentId,
      });
      toast.success("Team saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save team."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Configuration
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update team details and reassign to a different department if needed.
            </p>
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              disabled={
                !hasChanges ||
                isSaving ||
                !name.trim() ||
                !slug.trim() ||
                !departmentId
              }
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
            <Label htmlFor="team-edit-department">Department</Label>
            <select
              id="team-edit-department"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              className={cn(
                "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-4 text-sm text-foreground transition-colors",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {activeDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                  {!department.is_active ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-edit-name">Name</Label>
            <Input
              id="team-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-edit-slug">Slug</Label>
            <Input
              id="team-edit-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-edit-description">Description</Label>
            <textarea
              id="team-edit-description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional team description"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          {!canWrite && (
            <p className="text-[12px] text-muted-foreground">
              You have read-only access. Contact an admin to edit this team.
            </p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div className="flex items-center gap-2">
          <Calendar className={cn("size-4", accent.text)} />
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Team details
          </p>
        </div>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">
              {team.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono font-medium text-foreground">{team.slug}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(team.created_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(team.updated_at)}
            </dd>
          </div>
        </dl>
      </DashboardCard>
    </div>
  );
}

"use client";

import { Calendar, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/roles";
import { useUpdateRole } from "@/hooks/use-roles";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getRoleSlugLockedMessage, isRoleSlugLocked } from "@/lib/roles/guards";
import type { Role } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface RoleConfigPanelProps {
  role: Role;
  canWrite?: boolean;
}

export function RoleConfigPanel({ role, canWrite = true }: RoleConfigPanelProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const updateMutation = useUpdateRole(role.id);
  const slugLocked = isRoleSlugLocked(role);
  const slugLockedMessage = getRoleSlugLockedMessage(role);

  const [name, setName] = useState(role.name);
  const [slug, setSlug] = useState(role.slug);
  const [description, setDescription] = useState(role.description ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(role.name);
    setSlug(role.slug);
    setDescription(role.description ?? "");
    setHasChanges(false);
  }, [role.id, role.name, role.slug, role.description, role.updated_at]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        slug: slugLocked ? undefined : slug.trim(),
        description: description.trim() || null,
      });
      toast.success("Role saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save role."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Configuration
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update the role name, slug, and description.
            </p>
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              disabled={!hasChanges || isSaving || !name.trim() || (!slugLocked && !slug.trim())}
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
            <Label htmlFor="role-edit-name">Name</Label>
            <Input
              id="role-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-edit-slug">Slug</Label>
            <Input
              id="role-edit-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving || slugLocked}
            />
            {slugLockedMessage && (
              <p className="text-[12px] text-muted-foreground">{slugLockedMessage}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-edit-description">Description</Label>
            <textarea
              id="role-edit-description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional role description"
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
              You have read-only access. Contact an admin to edit this role.
            </p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-center gap-2">
          <Calendar className={cn("size-4", accent.text)} />
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Role details
          </p>
        </div>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">
              {role.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono font-medium text-foreground">{role.slug}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(role.created_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(role.updated_at)}
            </dd>
          </div>
        </dl>
      </DashboardCard>
    </div>
  );
}

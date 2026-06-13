"use client";

import { Calendar, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/permissions";
import { useUpdatePermission } from "@/hooks/use-permissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  normalizePermissionSlug,
  validatePermissionSlug,
} from "@/lib/permissions/guards";
import type { Permission } from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface PermissionConfigPanelProps {
  permission: Permission;
  canWrite?: boolean;
}

export function PermissionConfigPanel({
  permission,
  canWrite = true,
}: PermissionConfigPanelProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const updateMutation = useUpdatePermission(permission.id);

  const [name, setName] = useState(permission.name);
  const [slug, setSlug] = useState(permission.slug);
  const [description, setDescription] = useState(permission.description ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(permission.name);
    setSlug(permission.slug);
    setDescription(permission.description ?? "");
    setHasChanges(false);
  }, [
    permission.id,
    permission.name,
    permission.slug,
    permission.description,
    permission.updated_at,
  ]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;
  const slugError = hasChanges && slug.trim() ? validatePermissionSlug(slug) : null;

  const handleSave = async () => {
    const validationError = validatePermissionSlug(slug);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        slug: normalizePermissionSlug(slug),
        description: description.trim() || null,
      });
      toast.success("Permission saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save permission."));
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
              Update the permission name, slug, and description.
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
                Boolean(slugError)
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
            <Label htmlFor="permission-edit-name">Name</Label>
            <Input
              id="permission-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission-edit-slug">Slug</Label>
            <Input
              id="permission-edit-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
            {slugError && <p className="text-[12px] text-amber-400">{slugError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission-edit-description">Description</Label>
            <textarea
              id="permission-edit-description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional permission description"
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
              You have read-only access. Contact an admin to edit this permission.
            </p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-center gap-2">
          <Calendar className={cn("size-4", accent.text)} />
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Permission details
          </p>
        </div>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">
              {permission.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono font-medium text-foreground">{permission.slug}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(permission.created_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(permission.updated_at)}
            </dd>
          </div>
        </dl>
      </DashboardCard>
    </div>
  );
}

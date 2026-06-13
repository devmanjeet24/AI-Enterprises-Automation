"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/settings";
import { useUpdateOrganization } from "@/hooks/use-settings";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Organization } from "@/lib/settings/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface OrganizationSettingsPanelProps {
  organization: Organization;
  canWrite?: boolean;
}

export function OrganizationSettingsPanel({
  organization,
  canWrite = false,
}: OrganizationSettingsPanelProps) {
  const accent = dashboardAccents.neutral;
  const toast = useToast();
  const updateMutation = useUpdateOrganization();

  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(organization.name);
    setDescription(organization.description ?? "");
    setHasChanges(false);
  }, [organization.id, organization.name, organization.description, organization.updated_at]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success("Organization settings saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save organization settings."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="neutral" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Organization profile
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update your company name and workspace description.
            </p>
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              disabled={!hasChanges || isSaving || !name.trim()}
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
            <Label htmlFor="org-config-name">Organization name</Label>
            <Input
              id="org-config-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-config-description">Description</Label>
            <textarea
              id="org-config-description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional description of your organization"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          {!canWrite ? (
            <p className="text-[12px] text-muted-foreground">
              Organization settings can only be changed by an administrator.
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              The organization slug is set at registration and cannot be changed here.
            </p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard variant="panel" accent="neutral" interactive={false} className="p-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
          Workspace metadata
        </p>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono text-[12px] font-medium text-foreground">
              {organization.slug}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">
              {organization.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(organization.created_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(organization.updated_at)}
            </dd>
          </div>
        </dl>
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <p className={cn("text-[11px] font-medium uppercase tracking-[0.06em]", accent.textMuted)}>
            Organization ID
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{organization.id}</p>
        </div>
      </DashboardCard>
    </div>
  );
}

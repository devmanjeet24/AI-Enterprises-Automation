"use client";

import { Globe, Loader2, Monitor, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  formatViewport,
} from "@/config/browser-automation";
import { useUpdateBrowserProfile } from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BrowserProfile } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface BrowserProfileConfigPanelProps {
  profile: BrowserProfile;
  canWrite?: boolean;
}

export function BrowserProfileConfigPanel({
  profile,
  canWrite = true,
}: BrowserProfileConfigPanelProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const updateMutation = useUpdateBrowserProfile(profile.id);

  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? "");
  const [userAgent, setUserAgent] = useState(profile.user_agent ?? "");
  const [viewportWidth, setViewportWidth] = useState(
    profile.viewport_width?.toString() ?? "",
  );
  const [viewportHeight, setViewportHeight] = useState(
    profile.viewport_height?.toString() ?? "",
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setDescription(profile.description ?? "");
    setUserAgent(profile.user_agent ?? "");
    setViewportWidth(profile.viewport_width?.toString() ?? "");
    setViewportHeight(profile.viewport_height?.toString() ?? "");
    setHasChanges(false);
  }, [
    profile.id,
    profile.name,
    profile.description,
    profile.user_agent,
    profile.viewport_width,
    profile.viewport_height,
    profile.updated_at,
  ]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        user_agent: userAgent.trim() || null,
        viewport_width: viewportWidth ? Number.parseInt(viewportWidth, 10) : null,
        viewport_height: viewportHeight ? Number.parseInt(viewportHeight, 10) : null,
      });
      toast.success("Profile configuration saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save profile configuration."));
    }
  };

  const viewport = formatViewport(profile.viewport_width, profile.viewport_height);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Profile configuration
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update profile name, description, user agent, and viewport settings.
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
            <Label htmlFor="profile-config-name">Name</Label>
            <Input
              id="profile-config-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-config-description">Description</Label>
            <textarea
              id="profile-config-description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional profile description"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-config-user-agent">User agent</Label>
            <Input
              id="profile-config-user-agent"
              value={userAgent}
              onChange={(e) => {
                setUserAgent(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Optional custom user agent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-config-width">Viewport width</Label>
              <Input
                id="profile-config-width"
                type="number"
                value={viewportWidth}
                onChange={(e) => {
                  setViewportWidth(e.target.value);
                  markChanged();
                }}
                disabled={!canWrite || isSaving}
                placeholder="1920"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-config-height">Viewport height</Label>
              <Input
                id="profile-config-height"
                type="number"
                value={viewportHeight}
                onChange={(e) => {
                  setViewportHeight(e.target.value);
                  markChanged();
                }}
                disabled={!canWrite || isSaving}
                placeholder="1080"
              />
            </div>
          </div>

          {!canWrite && (
            <p className="text-[12px] text-muted-foreground">
              You have read-only access. Contact an admin to edit this profile.
            </p>
          )}
        </div>
      </DashboardCard>

      <div className="space-y-6">
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Monitor className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Browser settings
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium text-foreground">
                {profile.is_active ? "Active" : "Inactive"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Viewport</dt>
              <dd className="font-medium text-foreground">{viewport ?? "Default"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">User agent</dt>
              <dd className="max-w-[60%] truncate font-mono text-[12px] font-medium text-foreground">
                {profile.user_agent ?? "Default"}
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Globe className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Profile metadata
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(profile.created_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(profile.updated_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono text-[12px] font-medium text-foreground">
                {profile.slug}
              </dd>
            </div>
          </dl>
        </DashboardCard>
      </div>
    </div>
  );
}

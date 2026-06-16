"use client";

import { Globe, Layers, Loader2, Link2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  browserTaskStatusLabels,
  formatDateTime,
} from "@/config/browser-automation";
import {
  useBrowserProfiles,
  useUpdateBrowserTask,
} from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  buildTaskConfig,
  getSecretsFromConfig,
  type BrowserTaskSecrets,
} from "@/lib/browser-automation/secrets";
import {
  getStepsFromConfig,
  validateStepsForSave,
  type BrowserTaskStep,
} from "@/lib/browser-automation/steps";
import { canRunBrowserTask } from "@/lib/browser-automation/run-messages";
import type { BrowserTaskDetail, BrowserTaskStatus } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

import { BrowserTaskStepsEditor } from "./browser-task-steps-editor";
import { BrowserTaskSecretsEditor } from "./browser-task-secrets-editor";

interface BrowserTaskConfigPanelProps {
  task: BrowserTaskDetail;
  canWrite?: boolean;
}

const statusOptions: { value: BrowserTaskStatus; label: string }[] = [
  { value: "draft", label: browserTaskStatusLabels.draft },
  { value: "ready", label: browserTaskStatusLabels.ready },
  { value: "archived", label: browserTaskStatusLabels.archived },
];

export function BrowserTaskConfigPanel({
  task,
  canWrite = true,
}: BrowserTaskConfigPanelProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const updateMutation = useUpdateBrowserTask(task.id);
  const { data: profiles = [] } = useBrowserProfiles();

  const [name, setName] = useState(task.name);
  const [targetUrl, setTargetUrl] = useState(task.target_url ?? "");
  const [instructions, setInstructions] = useState(task.instructions ?? "");
  const [status, setStatus] = useState(task.status);
  const [browserProfileId, setBrowserProfileId] = useState(task.browser_profile_id);
  const [steps, setSteps] = useState<BrowserTaskStep[]>(() => getStepsFromConfig(task.config));
  const [secrets, setSecrets] = useState<BrowserTaskSecrets>(() =>
    getSecretsFromConfig(task.config),
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(task.name);
    setTargetUrl(task.target_url ?? "");
    setInstructions(task.instructions ?? "");
    setStatus(task.status);
    setBrowserProfileId(task.browser_profile_id);
    setSteps(getStepsFromConfig(task.config));
    setSecrets(getSecretsFromConfig(task.config));
    setHasChanges(false);
  }, [
    task.id,
    task.name,
    task.target_url,
    task.instructions,
    task.status,
    task.browser_profile_id,
    task.config,
    task.updated_at,
  ]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    const stepsError = validateStepsForSave(steps);
    if (stepsError) {
      toast.error(stepsError);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        target_url: targetUrl.trim() || null,
        instructions: instructions.trim() || null,
        status,
        browser_profile_id: browserProfileId,
        config: buildTaskConfig(task.config, steps, secrets),
      });
      toast.success("Task configuration saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save task configuration."));
    }
  };

  const runnable = canRunBrowserTask(task, true);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Task configuration
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update task settings, automation steps, and linked profile.
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
            <Label htmlFor="task-config-name">Name</Label>
            <Input
              id="task-config-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-config-url">Target URL</Label>
            <Input
              id="task-config-url"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="https://portal.example.com/orders"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-config-instructions">Notes (optional)</Label>
            <textarea
              id="task-config-instructions"
              rows={3}
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
              placeholder="Human-readable notes about this automation…"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          <BrowserTaskSecretsEditor
            secrets={secrets}
            disabled={!canWrite || isSaving}
            onChange={(nextSecrets) => {
              setSecrets(nextSecrets);
              markChanged();
            }}
          />

          <BrowserTaskStepsEditor
            steps={steps}
            disabled={!canWrite || isSaving}
            onChange={(nextSteps) => {
              setSteps(nextSteps);
              markChanged();
            }}
          />

          {canWrite ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-config-status">Status</Label>
                <select
                  id="task-config-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as BrowserTaskStatus);
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
                <Label htmlFor="task-config-profile">Linked browser profile</Label>
                <select
                  id="task-config-profile"
                  value={browserProfileId}
                  onChange={(e) => {
                    setBrowserProfileId(e.target.value);
                    markChanged();
                  }}
                  disabled={isSaving || profiles.length === 0}
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                      {!profile.is_active ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              You have read-only access. Contact an admin to edit this task.
            </p>
          )}
        </div>
      </DashboardCard>

      <div className="space-y-6">
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Link2 className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Linked browser profile
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Profile</dt>
              <dd>
                <Link
                  href={`/browser-automation/profiles/${task.browser_profile_id}`}
                  className="font-medium text-foreground hover:text-brand"
                >
                  {task.profile_name}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Profile status</dt>
              <dd className="font-medium text-foreground">
                {task.profile_is_active ? "Active" : "Inactive"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Target URL</dt>
              <dd className="max-w-[60%] truncate font-mono text-[12px] font-medium text-foreground">
                {task.target_url ?? "—"}
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Globe className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Task metadata
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(task.created_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium text-foreground">
                {formatDateTime(task.updated_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Runnable</dt>
              <dd className="font-medium text-foreground">{runnable ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <div className="flex items-center gap-2">
            <Layers className={cn("size-4", accent.text)} />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Task summary
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium text-foreground">
                {browserTaskStatusLabels[task.status]}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Configured steps</dt>
              <dd className="font-medium text-foreground">
                {steps.length > 0 ? steps.length : "Default pipeline"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Notes length</dt>
              <dd className="font-medium text-foreground">
                {(task.instructions ?? "").length} chars
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono text-[12px] font-medium text-foreground">
                {task.slug}
              </dd>
            </div>
          </dl>
        </DashboardCard>
      </div>
    </div>
  );
}

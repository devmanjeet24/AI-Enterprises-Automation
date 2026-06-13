"use client";

import { Globe, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyBrowserName } from "@/config/browser-automation";
import { useCreateBrowserTask } from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BrowserProfile } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  profiles: BrowserProfile[];
}

export function CreateTaskModal({ open, onClose, profiles }: CreateTaskModalProps) {
  const toast = useToast();
  const createMutation = useCreateBrowserTask();
  const accent = dashboardAccents.blue;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [browserProfileId, setBrowserProfileId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [instructions, setInstructions] = useState("");

  const availableProfiles = profiles.filter((profile) => profile.is_active);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setBrowserProfileId("");
    setTargetUrl("");
    setInstructions("");
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
    if (availableProfiles.length > 0 && !browserProfileId) {
      setBrowserProfileId(availableProfiles[0].id);
    }
  }, [availableProfiles, browserProfileId]);

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    try {
      const task = await createMutation.mutateAsync({
        name: name.trim(),
        slug: slugifyBrowserName(name),
        description: description.trim() || undefined,
        browser_profile_id: browserProfileId,
        target_url: targetUrl.trim() || undefined,
        instructions: instructions.trim() || undefined,
      });
      toast.success(`"${task.name}" created as draft. Mark it ready before running.`);
      resetForm();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create browser task."));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close create task modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={createMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0c1220]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(107,155,248,0.4) 50%, transparent)",
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
              <Globe className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Browser Automation
              </p>
              <h2
                id="create-task-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Create browser task
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Tasks start as draft. Add a target URL and instructions, then mark the task
                ready before running.
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
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              placeholder="e.g. Extract Order Status"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description (optional)</Label>
            <textarea
              id="task-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="What should this automation accomplish?"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-profile">Browser profile</Label>
            <select
              id="task-profile"
              value={browserProfileId}
              onChange={(e) => setBrowserProfileId(e.target.value)}
              disabled={createMutation.isPending || availableProfiles.length === 0}
              className={cn(
                "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">
                {availableProfiles.length === 0
                  ? "No active profiles available"
                  : "Select profile…"}
              </option>
              {availableProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-url">Target URL</Label>
            <Input
              id="task-url"
              placeholder="https://portal.example.com/orders"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-instructions">Instructions (optional)</Label>
            <textarea
              id="task-instructions"
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="Describe the steps the browser should perform…"
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
              !browserProfileId ||
              !targetUrl.trim() ||
              createMutation.isPending ||
              availableProfiles.length === 0
            }
            onClick={handleCreate}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {createMutation.isPending ? "Creating…" : "Create task"}
          </Button>
        </div>
      </div>
    </div>
  );
}

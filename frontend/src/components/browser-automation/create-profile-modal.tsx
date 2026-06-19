"use client";

import { Globe, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyBrowserName } from "@/config/browser-automation";
import { useCreateBrowserProfile } from "@/hooks/use-browser-automation";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface CreateProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProfileModal({ open, onClose }: CreateProfileModalProps) {
  const toast = useToast();
  const createMutation = useCreateBrowserProfile();
  const accent = dashboardAccents.blue;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [viewportWidth, setViewportWidth] = useState("1280");
  const [viewportHeight, setViewportHeight] = useState("720");

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setUserAgent("");
    setViewportWidth("1280");
    setViewportHeight("720");
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

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    await runMutationWithFeedback({
      action: () => {
        const width = parseInt(viewportWidth, 10);
        const height = parseInt(viewportHeight, 10);
        return createMutation.mutateAsync({
          name: name.trim(),
          slug: slugifyBrowserName(name),
          description: description.trim() || undefined,
          user_agent: userAgent.trim() || undefined,
          viewport_width: Number.isFinite(width) ? width : undefined,
          viewport_height: Number.isFinite(height) ? height : undefined,
        });
      },
      toast,
      successMessage: (profile) =>
        `Browser profile "${profile.name}" created successfully.`,
      errorFallback: "Failed to create browser profile.",
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close create profile modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={createMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-profile-title"
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
                id="create-profile-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Create browser profile
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Profiles define viewport and user-agent settings for automation tasks.
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
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              placeholder="e.g. Vendor Portal Desktop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-description">Description (optional)</Label>
            <textarea
              id="profile-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="What is this browser profile used for?"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-user-agent">User agent (optional)</Label>
            <Input
              id="profile-user-agent"
              placeholder="Mozilla/5.0 ..."
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-width">Viewport width</Label>
              <Input
                id="profile-width"
                type="number"
                min={1}
                max={10000}
                value={viewportWidth}
                onChange={(e) => setViewportWidth(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-height">Viewport height</Label>
              <Input
                id="profile-height"
                type="number"
                min={1}
                max={10000}
                value={viewportHeight}
                onChange={(e) => setViewportHeight(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
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
            disabled={!name.trim() || createMutation.isPending}
            onClick={handleCreate}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {createMutation.isPending ? "Creating…" : "Create profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Loader2, Network, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyTeamName } from "@/config/teams";
import { useDepartments } from "@/hooks/use-departments";
import { useCreateTeam } from "@/hooks/use-teams";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import { getCreateTeamBlockedMessage } from "@/lib/teams/guards";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  defaultDepartmentId?: string;
}

export function CreateTeamModal({
  open,
  onClose,
  defaultDepartmentId,
}: CreateTeamModalProps) {
  const toast = useToast();
  const createMutation = useCreateTeam();
  const accent = dashboardAccents.blue;
  const { data: departments = [] } = useDepartments();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.is_active),
    [departments],
  );

  const createBlockedMessage = getCreateTeamBlockedMessage(departments);

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setDescription("");
    setDepartmentId(defaultDepartmentId ?? activeDepartments[0]?.id ?? "");
    setSlugTouched(false);
  }, [activeDepartments, defaultDepartmentId]);

  useEffect(() => {
    if (open) {
      setDepartmentId(defaultDepartmentId ?? activeDepartments[0]?.id ?? "");
    }
  }, [open, defaultDepartmentId, activeDepartments]);

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

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyTeamName(value));
    }
  };

  const handleCreate = async () => {
    if (!departmentId) {
      toast.error("Select a department for this team.");
      return;
    }

    await runMutationWithFeedback({
      action: () =>
        createMutation.mutateAsync({
          department_id: departmentId,
          name: name.trim(),
          slug: slug.trim() || slugifyTeamName(name),
          description: description.trim() || undefined,
        }),
      toast,
      successMessage: (team) => `Team "${team.name}" created successfully.`,
      errorFallback: "Failed to create team.",
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
        aria-label="Close create team modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={createMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-team-title"
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
              <Network className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Settings · Org Teams
              </p>
              <h2
                id="create-team-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Create org team
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Teams are nested under departments. Not to be confused with Agent Teams.
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

        {createBlockedMessage ? (
          <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-[13px] text-amber-200">
            {createBlockedMessage}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-department">Department</Label>
              <select
                id="team-department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={createMutation.isPending}
                className={cn(
                  "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-4 text-sm text-foreground transition-colors",
                  "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {activeDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-name">Name</Label>
              <Input
                id="team-name"
                placeholder="e.g. Platform Engineering"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-slug">Slug</Label>
              <Input
                id="team-slug"
                placeholder="platform-engineering"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">Description (optional)</Label>
              <textarea
                id="team-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createMutation.isPending}
                placeholder="What does this team focus on?"
                className={cn(
                  "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                  "placeholder:text-tertiary",
                  "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
            </div>
          </div>
        )}

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
              Boolean(createBlockedMessage) ||
              !name.trim() ||
              !departmentId ||
              createMutation.isPending
            }
            onClick={handleCreate}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {createMutation.isPending ? "Creating…" : "Create team"}
          </Button>
        </div>
      </div>
    </div>
  );
}

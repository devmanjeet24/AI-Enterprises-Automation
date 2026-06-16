"use client";

import { Building2, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyDepartmentName } from "@/config/departments";
import { useCreateDepartment } from "@/hooks/use-departments";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface CreateDepartmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateDepartmentModal({ open, onClose }: CreateDepartmentModalProps) {
  const toast = useToast();
  const createMutation = useCreateDepartment();
  const accent = dashboardAccents.blue;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setDescription("");
    setSlugTouched(false);
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

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyDepartmentName(value));
    }
  };

  const handleCreate = async () => {
    await runMutationWithFeedback({
      action: () =>
        createMutation.mutateAsync({
          name: name.trim(),
          slug: slug.trim() || slugifyDepartmentName(name),
          description: description.trim() || undefined,
        }),
      toast,
      successMessage: (department) =>
        `Department "${department.name}" created successfully.`,
      errorFallback: "Failed to create department.",
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
        aria-label="Close create department modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={createMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-department-title"
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
              <Building2 className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Settings · Departments
              </p>
              <h2
                id="create-department-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Create department
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Departments are top-level organizational units. Teams are created under them.
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
            <Label htmlFor="department-name">Name</Label>
            <Input
              id="department-name"
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-slug">Slug</Label>
            <Input
              id="department-slug"
              placeholder="engineering"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department-description">Description (optional)</Label>
            <textarea
              id="department-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="What does this department own?"
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
            disabled={!name.trim() || createMutation.isPending}
            onClick={handleCreate}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {createMutation.isPending ? "Creating…" : "Create department"}
          </Button>
        </div>
      </div>
    </div>
  );
}

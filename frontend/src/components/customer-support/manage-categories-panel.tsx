"use client";

import { Loader2, Plus, Tag, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS } from "@/config/customer-support";
import { useCreateSupportCategory } from "@/hooks/use-support-tickets";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/providers/toast-provider";

interface ManageCategoriesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ManageCategoriesPanel({ open, onClose }: ManageCategoriesPanelProps) {
  const toast = useToast();
  const createMutation = useCreateSupportCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setColor(CATEGORY_COLORS[0]);
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

  if (!open) return null;

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      toast.success("Category created.");
      resetForm();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create category."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close modal"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-[#6B9BF8]" />
            <h2 className="text-[16px] font-medium text-foreground">New category</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Billing"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="category-description">Description</Label>
            <Input
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: option,
                    borderColor: color === option ? "#fff" : "transparent",
                  }}
                  aria-label={`Select color ${option}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => void handleCreate()}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Create category
          </Button>
        </div>
      </div>
    </div>
  );
}

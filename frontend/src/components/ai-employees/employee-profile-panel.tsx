"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDate } from "@/config/knowledge-base";
import { useUpdateEmployee } from "@/hooks/use-ai-employees";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AIEmployeeDetail } from "@/lib/ai-employees/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface EmployeeProfilePanelProps {
  employee: AIEmployeeDetail;
  canEdit?: boolean;
}

export function EmployeeProfilePanel({
  employee,
  canEdit = true,
}: EmployeeProfilePanelProps) {
  const toast = useToast();
  const updateMutation = useUpdateEmployee(employee.id);

  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [description, setDescription] = useState(employee.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(employee.system_prompt);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setName(employee.name);
      setRole(employee.role);
      setDescription(employee.description ?? "");
      setSystemPrompt(employee.system_prompt);
    }
  }, [employee, isEditing]);

  const handleCancel = () => {
    setName(employee.name);
    setRole(employee.role);
    setDescription(employee.description ?? "");
    setSystemPrompt(employee.system_prompt);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        role: role.trim(),
        description: description.trim() || null,
        system_prompt: systemPrompt.trim(),
      });
      toast.success("Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update profile."));
    }
  };

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
          Profile
        </p>
        {canEdit && !isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Input
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-prompt">System prompt</Label>
            <textarea
              id="edit-prompt"
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={updateMutation.isPending}
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground",
                "focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              size="sm"
              disabled={
                !name.trim() ||
                !role.trim() ||
                !systemPrompt.trim() ||
                updateMutation.isPending
              }
              onClick={handleSave}
            >
              {updateMutation.isPending && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <dl className="mt-5 divide-y divide-white/[0.05]">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted-foreground">Name</dt>
            <dd className="text-right text-[13px] font-medium text-foreground">{employee.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted-foreground">Role</dt>
            <dd className="text-right text-[13px] font-medium text-foreground">{employee.role}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted-foreground">Description</dt>
            <dd className="max-w-[60%] text-right text-[13px] text-foreground">
              {employee.description || "—"}
            </dd>
          </div>
          <div className="py-2.5">
            <dt className="text-[13px] text-muted-foreground">System prompt</dt>
            <dd className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[13px] leading-relaxed text-muted-foreground">
              {employee.system_prompt}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted-foreground">Created</dt>
            <dd className="text-[13px] text-foreground">{formatDate(employee.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted-foreground">Last updated</dt>
            <dd className="text-[13px] text-foreground">{formatDate(employee.updated_at)}</dd>
          </div>
        </dl>
      )}
    </DashboardCard>
  );
}

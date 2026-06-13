"use client";

import { Calendar, Loader2, Mail, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/users";
import { useUpdateUser } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { User } from "@/lib/users/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface UserProfilePanelProps {
  user: User;
  canWrite?: boolean;
}

export function UserProfilePanel({ user, canWrite = true }: UserProfilePanelProps) {
  const accent = dashboardAccents.emerald;
  const toast = useToast();
  const updateMutation = useUpdateUser(user.id);

  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setHasChanges(false);
  }, [user.id, user.first_name, user.last_name, user.updated_at]);

  const markChanged = () => setHasChanges(true);
  const isSaving = updateMutation.isPending;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      toast.success("User profile saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save user profile."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Profile
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Update the user&apos;s name. Email is managed separately.
            </p>
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              disabled={!hasChanges || isSaving || !firstName.trim()}
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
            <Label htmlFor="user-first-name">First name</Label>
            <Input
              id="user-first-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-last-name">Last name</Label>
            <Input
              id="user-last-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                markChanged();
              }}
              disabled={!canWrite || isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" value={user.email} disabled readOnly />
          </div>

          {!canWrite && (
            <p className="text-[12px] text-muted-foreground">
              You have read-only access. Contact an admin to edit this profile.
            </p>
          )}
        </div>
      </DashboardCard>

      <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-6">
        <div className="flex items-center gap-2">
          <Calendar className={cn("size-4", accent.text)} />
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Account details
          </p>
        </div>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">
              {user.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5" />
              Email
            </dt>
            <dd className="truncate font-medium text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Roles</dt>
            <dd className="font-medium text-foreground">
              {user.roles.length > 0
                ? user.roles.map((role) => role.name).join(", ")
                : "None"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(user.created_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(user.updated_at)}
            </dd>
          </div>
        </dl>
      </DashboardCard>
    </div>
  );
}

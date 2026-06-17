"use client";

import { Copy, Loader2, MailPlus, Plus, RefreshCw, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateUser,
  useInviteUser,
  useResendUserInvitation,
  useRoles,
} from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/lib/roles/types";
import type { UserInvitation } from "@/lib/users/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";

type ActiveDialog = "create" | "invite" | null;

interface UserManagementActionsProps {
  canWrite: boolean;
  canAssignRole?: boolean;
}

interface PendingInvitationsProps {
  invitations: UserInvitation[];
  canWrite: boolean;
}

interface UserFormValues {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: string;
}

interface InviteFormValues {
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
}

const initialUserValues: UserFormValues = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role_id: "",
};

const initialInviteValues: InviteFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  role_id: "",
};

function copyToClipboard(value: string, toast: ReturnType<typeof useToast>) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success("Invitation link copied."))
    .catch(() => toast.error("Unable to copy invitation link."));
}

function RoleSelect({
  roles,
  value,
  onChange,
  canAssignRole,
}: {
  roles: Role[];
  value: string;
  onChange: (value: string) => void;
  canAssignRole: boolean;
}) {
  const activeRoles = roles.filter((role) => role.is_active);

  if (!canAssignRole) {
    return (
      <div className="space-y-1.5">
        <Label className="text-[13px] text-muted-foreground">Initial role</Label>
        <p className="text-[13px] text-muted-foreground">Member (default)</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="role_id" className="text-[13px] text-muted-foreground">
        Initial role
      </Label>
      <select
        id="role_id"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-11 w-full rounded-xl border border-border bg-white/[0.04] px-4 text-sm text-foreground transition-colors hover:border-border-default focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <option value="">Member (default)</option>
        {activeRoles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function DialogShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl tracking-[-0.02em] text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UserManagementActions({
  canWrite,
  canAssignRole = false,
}: UserManagementActionsProps) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  if (!canWrite) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="brand" size="sm" onClick={() => setActiveDialog("create")}>
          <Plus className="size-3.5" />
          Create user
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setActiveDialog("invite")}>
          <MailPlus className="size-3.5" />
          Invite user
        </Button>
      </div>

      {activeDialog === "create" && (
        <CreateUserDialog onClose={() => setActiveDialog(null)} canAssignRole={canAssignRole} />
      )}
      {activeDialog === "invite" && (
        <InviteUserDialog onClose={() => setActiveDialog(null)} canAssignRole={canAssignRole} />
      )}
    </>
  );
}

function CreateUserDialog({
  onClose,
  canAssignRole,
}: {
  onClose: () => void;
  canAssignRole: boolean;
}) {
  const toast = useToast();
  const createMutation = useCreateUser();
  const { data: roles = [] } = useRoles();
  const [values, setValues] = useState(initialUserValues);

  const update = (field: keyof UserFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        ...(values.role_id ? { role_id: values.role_id } : {}),
      });
      toast.success("User created.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create user."));
    }
  };

  return (
    <DialogShell
      title="Create user"
      description="Create an active account immediately. Share the password securely."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="create_first_name" className="text-[13px] text-muted-foreground">
              First name
            </Label>
            <Input
              id="create_first_name"
              value={values.first_name}
              onChange={(event) => update("first_name", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create_last_name" className="text-[13px] text-muted-foreground">
              Last name
            </Label>
            <Input
              id="create_last_name"
              value={values.last_name}
              onChange={(event) => update("last_name", event.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create_email" className="text-[13px] text-muted-foreground">
            Email
          </Label>
          <Input
            id="create_email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create_password" className="text-[13px] text-muted-foreground">
            Temporary password
          </Label>
          <Input
            id="create_password"
            type="password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            minLength={8}
            required
          />
        </div>
        <RoleSelect
          roles={roles}
          value={values.role_id}
          onChange={(value) => update("role_id", value)}
          canAssignRole={canAssignRole}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Create user
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}

function InviteUserDialog({
  onClose,
  canAssignRole,
}: {
  onClose: () => void;
  canAssignRole: boolean;
}) {
  const toast = useToast();
  const inviteMutation = useInviteUser();
  const { data: roles = [] } = useRoles();
  const [values, setValues] = useState(initialInviteValues);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const update = (field: keyof InviteFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const invitation = await inviteMutation.mutateAsync({
        email: values.email.trim(),
        ...(values.first_name.trim() ? { first_name: values.first_name.trim() } : {}),
        ...(values.last_name.trim() ? { last_name: values.last_name.trim() } : {}),
        ...(values.role_id ? { role_id: values.role_id } : {}),
      });
      setInviteUrl(invitation.invite_url);
      toast.success("Invitation created.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to invite user."));
    }
  };

  return (
    <DialogShell
      title="Invite user"
      description="Create a one-time invitation link for someone to join this organization."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="invite_email" className="text-[13px] text-muted-foreground">
            Email
          </Label>
          <Input
            id="invite_email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite_first_name" className="text-[13px] text-muted-foreground">
              First name
            </Label>
            <Input
              id="invite_first_name"
              value={values.first_name}
              onChange={(event) => update("first_name", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite_last_name" className="text-[13px] text-muted-foreground">
              Last name
            </Label>
            <Input
              id="invite_last_name"
              value={values.last_name}
              onChange={(event) => update("last_name", event.target.value)}
            />
          </div>
        </div>
        <RoleSelect
          roles={roles}
          value={values.role_id}
          onChange={(value) => update("role_id", value)}
          canAssignRole={canAssignRole}
        />
        {inviteUrl && (
          <div className="rounded-xl border border-border bg-white/[0.03] p-3">
            <p className="text-[12px] text-muted-foreground">Invitation link</p>
            <div className="mt-2 flex gap-2">
              <Input value={inviteUrl} readOnly className="text-xs" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => copyToClipboard(inviteUrl, toast)}
                aria-label="Copy invitation link"
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" variant="brand" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Create invite
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}

export function PendingInvitations({ invitations, canWrite }: PendingInvitationsProps) {
  const toast = useToast();
  const resendMutation = useResendUserInvitation();
  const pendingInvitations = invitations.filter((invitation) => !invitation.accepted_at);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      const invitation = await resendMutation.mutateAsync(invitationId);
      if (invitation.invite_url) {
        copyToClipboard(invitation.invite_url, toast);
      }
      toast.success("Invitation resent.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to resend invitation."));
    } finally {
      setResendingId(null);
    }
  };

  if (pendingInvitations.length === 0) return null;

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Pending invites
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Resend one-time links for users who have not accepted yet.
          </p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {pendingInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{invitation.email}</p>
              <p className="text-xs text-muted-foreground">
                Role: {invitation.role.name} · Expires{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(invitation.expires_at))}
              </p>
            </div>
            {canWrite && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={cn("shrink-0", resendingId === invitation.id && "opacity-80")}
                disabled={resendMutation.isPending}
                onClick={() => handleResend(invitation.id)}
              >
                {resendingId === invitation.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Resend invite
              </Button>
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

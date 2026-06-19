"use client";

import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Label } from "@/components/ui/label";
import {
  supportPriorityLabels,
  supportStatusLabels,
  formatDateTime,
} from "@/config/customer-support";
import { useEmployees } from "@/hooks/use-ai-employees";
import {
  useDeleteSupportTicket,
  useSupportCategories,
  useUpdateSupportTicket,
} from "@/hooks/use-support-tickets";
import { useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  SupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/lib/customer-support/types";
import { useToast } from "@/providers/toast-provider";

interface SupportTicketSidebarProps {
  ticket: SupportTicketDetail;
  canWrite: boolean;
  canDelete: boolean;
  canExecute: boolean;
}

export function SupportTicketSidebar({
  ticket,
  canWrite,
  canDelete,
  canExecute,
}: SupportTicketSidebarProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateSupportTicket(ticket.id);
  const deleteMutation = useDeleteSupportTicket();
  const { data: categories = [] } = useSupportCategories(true);
  const { data: users = [] } = useUsers();
  const { data: employees = [] } = useEmployees("active");

  const [status, setStatus] = useState<SupportTicketStatus>(ticket.status);
  const [priority, setPriority] = useState<SupportTicketPriority>(ticket.priority);
  const [categoryId, setCategoryId] = useState(ticket.category_id ?? "");
  const [assignedUserId, setAssignedUserId] = useState(ticket.assigned_user_id ?? "");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    ticket.assigned_ai_employee_id ?? "",
  );

  const isSaving = updateMutation.isPending;
  const canSelectResolved = ticket.has_resolution || ticket.status === "resolved";

  const handleSave = async () => {
    if (status === "resolved" && !canSelectResolved) {
      toast.error(
        "Send a public agent or AI reply before resolving this ticket.",
      );
      return;
    }

    try {
      await updateMutation.mutateAsync({
        status,
        priority,
        category_id: categoryId || null,
        assigned_user_id: assignedUserId || null,
        assigned_ai_employee_id: assignedEmployeeId || null,
      });
      toast.success("Ticket updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update ticket."));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this ticket permanently?")) return;

    try {
      await deleteMutation.mutateAsync(ticket.id);
      toast.success("Ticket deleted.");
      router.push("/customer-support");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete ticket."));
    }
  };

  return (
    <DashboardCard variant="panel" accent="blue" className="p-5">
      <h3 className="text-[14px] font-medium text-foreground">Ticket management</h3>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        Update status, category, and assignments
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="ticket-status">Status</Label>
          <select
            id="ticket-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as SupportTicketStatus)}
            disabled={!canWrite && !canExecute}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            {Object.entries(supportStatusLabels).map(([value, label]) => (
              <option
                key={value}
                value={value}
                disabled={value === "resolved" && !canSelectResolved}
              >
                {label}
                {value === "resolved" && !canSelectResolved ? " (reply required)" : ""}
              </option>
            ))}
          </select>
          {!canSelectResolved && ticket.status !== "resolved" && (
            <p className="mt-1.5 text-[11px] text-amber-400">
              Resolve is available after a public agent or AI employee reply is sent.
            </p>
          )}
          {ticket.resolved_at && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Resolved {formatDateTime(ticket.resolved_at)}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="ticket-priority-sidebar">Priority</Label>
          <select
            id="ticket-priority-sidebar"
            value={priority}
            onChange={(event) => setPriority(event.target.value as SupportTicketPriority)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            {Object.entries(supportPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="ticket-category-sidebar">Category</Label>
          <select
            id="ticket-category-sidebar"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="assign-user-sidebar">Assigned user</Label>
          <select
            id="assign-user-sidebar"
            value={assignedUserId}
            onChange={(event) => setAssignedUserId(event.target.value)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {users
              .filter((user) => user.is_active)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <Label htmlFor="assign-employee-sidebar">Assigned AI employee</Label>
          <select
            id="assign-employee-sidebar"
            value={assignedEmployeeId}
            onChange={(event) => setAssignedEmployeeId(event.target.value)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {(assignedEmployeeId || ticket.assigned_ai_employee_id) && (
            <Link
              href={`/ai-employees/${assignedEmployeeId || ticket.assigned_ai_employee_id}`}
              className="mt-2 inline-block text-[12px] font-medium text-[#6B9BF8] hover:underline"
            >
              View AI employee profile
            </Link>
          )}
        </div>
      </div>

      {(canWrite || canExecute) && (
        <Button
          variant="brand"
          size="sm"
          className="mt-5 w-full"
          onClick={() => void handleSave()}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          Save changes
        </Button>
      )}

      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-destructive hover:text-destructive"
          onClick={() => void handleDelete()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="size-3.5" />
          Delete ticket
        </Button>
      )}
    </DashboardCard>
  );
}

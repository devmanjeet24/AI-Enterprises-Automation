"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Label } from "@/components/ui/label";
import {
  conversationStatusLabels,
  formatDateTime,
  handoffStatusLabels,
} from "@/config/omnichannel";
import { useEmployees } from "@/hooks/use-ai-employees";
import { useUpdateOmnichannelConversation } from "@/hooks/use-omnichannel";
import { useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  OmnichannelConversationDetail,
  OmnichannelConversationStatus,
  OmnichannelHandoffStatus,
} from "@/lib/omnichannel/types";
import { useToast } from "@/providers/toast-provider";

interface OmnichannelConversationSidebarProps {
  conversation: OmnichannelConversationDetail;
  canWrite: boolean;
}

export function OmnichannelConversationSidebar({
  conversation,
  canWrite,
}: OmnichannelConversationSidebarProps) {
  const toast = useToast();
  const updateMutation = useUpdateOmnichannelConversation(conversation.id);
  const { data: users = [] } = useUsers();
  const { data: employees = [] } = useEmployees("active");

  const [status, setStatus] = useState<OmnichannelConversationStatus>(conversation.status);
  const [handoffStatus, setHandoffStatus] = useState<OmnichannelHandoffStatus>(
    conversation.handoff_status,
  );
  const [assignedUserId, setAssignedUserId] = useState(conversation.assigned_user_id ?? "");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    conversation.assigned_ai_employee_id ?? "",
  );

  useEffect(() => {
    setStatus(conversation.status);
    setHandoffStatus(conversation.handoff_status);
    setAssignedUserId(conversation.assigned_user_id ?? "");
    setAssignedEmployeeId(conversation.assigned_ai_employee_id ?? "");
  }, [
    conversation.id,
    conversation.status,
    conversation.handoff_status,
    conversation.assigned_user_id,
    conversation.assigned_ai_employee_id,
  ]);

  const canSelectResolved = conversation.has_resolution || conversation.status === "resolved";

  const handleSave = async () => {
    if (status === "resolved" && !canSelectResolved) {
      toast.error("Send a public agent or AI reply before resolving this conversation.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        status,
        handoff_status: handoffStatus,
        assigned_user_id: assignedUserId || null,
        assigned_ai_employee_id: assignedEmployeeId || null,
      });
      toast.success("Conversation updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update conversation."));
    }
  };

  return (
    <DashboardCard variant="panel" accent="purple" className="p-5">
      <h3 className="text-[14px] font-medium text-foreground">Conversation management</h3>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        Assign agents, update status, and manage handoff
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="conversation-status">Status</Label>
          <select
            id="conversation-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as OmnichannelConversationStatus)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            {Object.entries(conversationStatusLabels).map(([value, label]) => (
              <option
                key={value}
                value={value}
                disabled={value === "resolved" && !canSelectResolved}
              >
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="handoff-status">Handoff</Label>
          <select
            id="handoff-status"
            value={handoffStatus}
            onChange={(event) => setHandoffStatus(event.target.value as OmnichannelHandoffStatus)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            {Object.entries(handoffStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="assigned-user">Assigned agent</Label>
          <select
            id="assigned-user"
            value={assignedUserId}
            onChange={(event) => setAssignedUserId(event.target.value)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="assigned-employee">AI employee</Label>
          <select
            id="assigned-employee"
            value={assignedEmployeeId}
            onChange={(event) => setAssignedEmployeeId(event.target.value)}
            disabled={!canWrite}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-foreground outline-none disabled:opacity-50"
          >
            <option value="">None</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        {canWrite && (
          <Button
            variant="brand"
            size="sm"
            className="w-full"
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save changes
          </Button>
        )}
      </div>

      <dl className="mt-6 space-y-3 border-t border-white/[0.06] pt-4 text-[13px]">
        <div>
          <dt className="text-muted-foreground">Contact</dt>
          <dd className="mt-0.5">{conversation.external_contact_name ?? "—"}</dd>
        </div>
        {typeof conversation.shared_context?.email === "string" &&
          conversation.shared_context.email && (
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${conversation.shared_context.email}`}
                  className="text-brand hover:underline"
                >
                  {conversation.shared_context.email}
                </a>
              </dd>
            </div>
          )}
        <div>
          <dt className="text-muted-foreground">Last activity</dt>
          <dd className="mt-0.5">{formatDateTime(conversation.last_message_at)}</dd>
        </div>
        {conversation.support_ticket_id && (
          <div>
            <dt className="text-muted-foreground">Support ticket</dt>
            <dd className="mt-0.5">
              <Link
                href={`/customer-support/${conversation.support_ticket_id}`}
                className="font-medium text-brand hover:underline"
              >
                View escalated ticket
              </Link>
            </dd>
          </div>
        )}
      </dl>
    </DashboardCard>
  );
}

"use client";

import { Bot, GripVertical, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { collaborationRoleSuggestions } from "@/config/agent-teams";
import {
  useAddTeamMember,
  useAssignableEmployees,
  useRemoveTeamMember,
} from "@/hooks/use-agent-teams";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AgentTeamDetail } from "@/lib/agent-teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface TeamMemberAssignmentProps {
  team: AgentTeamDetail;
  canWrite?: boolean;
}

export function TeamMemberAssignment({
  team,
  canWrite = true,
}: TeamMemberAssignmentProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const addMutation = useAddTeamMember(team.id);
  const removeMutation = useRemoveTeamMember(team.id);
  const { data: assignableEmployees = [], isLoading: isLoadingEmployees } =
    useAssignableEmployees();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [collaborationRole, setCollaborationRole] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const members = useMemo(
    () =>
      [...team.members].sort(
        (a, b) => a.sequence_order - b.sequence_order || a.added_at.localeCompare(b.added_at),
      ),
    [team.members],
  );

  const assignedIds = new Set(members.map((member) => member.ai_employee_id));
  const availableEmployees = assignableEmployees.filter(
    (employee) => !assignedIds.has(employee.id),
  );

  const handleAddMember = async () => {
    if (!selectedEmployeeId || !collaborationRole.trim()) return;

    const nextOrder =
      members.length > 0
        ? Math.max(...members.map((member) => member.sequence_order)) + 1
        : 0;

    try {
      await addMutation.mutateAsync({
        ai_employee_id: selectedEmployeeId,
        collaboration_role: collaborationRole.trim(),
        sequence_order: nextOrder,
      });
      toast.success("Team member added.");
      setSelectedEmployeeId("");
      setCollaborationRole("");
      setShowAddForm(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add team member."));
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemovingMemberId(memberId);
    try {
      await removeMutation.mutateAsync(memberId);
      toast.success("Team member removed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove team member."));
    } finally {
      setRemovingMemberId(null);
    }
  };

  const isAdding = addMutation.isPending;

  return (
    <div className="space-y-6">
      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Team members
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Assign active AI employees with collaboration roles. Execution runs in
              sequence order.
            </p>
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={isLoadingEmployees || availableEmployees.length === 0}
            >
              <UserPlus className="size-3.5" />
              Add member
            </Button>
          )}
        </div>

        {showAddForm && (
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[13px] font-medium text-foreground">Add team member</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-employee">AI Employee</Label>
                <select
                  id="add-employee"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={isLoadingEmployees || isAdding}
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  <option value="">
                    {isLoadingEmployees ? "Loading employees…" : "Select employee…"}
                  </option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} — {employee.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-role">Collaboration role</Label>
                <Input
                  id="add-role"
                  placeholder="e.g. Researcher"
                  value={collaborationRole}
                  onChange={(e) => setCollaborationRole(e.target.value)}
                  disabled={isAdding}
                  list="role-suggestions"
                />
                <datalist id="role-suggestions">
                  {collaborationRoleSuggestions.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="sm"
                disabled={!selectedEmployeeId || !collaborationRole.trim() || isAdding}
                onClick={handleAddMember}
              >
                {isAdding ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                Add
              </Button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
            <Bot className="mx-auto size-8 text-tertiary" />
            <p className="mt-3 text-[14px] font-medium text-foreground">No members yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Add active AI employees to build your execution pipeline.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <GripVertical className="size-4 shrink-0 text-tertiary" />
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold",
                    accent.border,
                    accent.text,
                  )}
                >
                  {member.sequence_order + 1}
                </span>
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    accent.bgSubtle,
                    accent.border,
                  )}
                >
                  <Bot className={cn("size-4", accent.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    <Link
                      href={`/ai-employees/${member.ai_employee_id}`}
                      className="transition-colors hover:text-brand"
                    >
                      {member.employee_name}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {member.collaboration_role} · {member.employee_role}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    member.employee_status === "active"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-white/[0.06] text-muted-foreground",
                  )}
                >
                  {member.employee_status}
                </span>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={removingMemberId === member.id}
                    onClick={() => handleRemove(member.id)}
                  >
                    {removingMemberId === member.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {members.length > 0 && (
          <p className="mt-4 text-[12px] text-tertiary">
            Pipeline order: members execute sequentially from top to bottom.
          </p>
        )}
      </DashboardCard>
    </div>
  );
}

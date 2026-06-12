"use client";

import { ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useEmployee } from "@/hooks/use-ai-employees";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { getEmployeeInitials } from "@/config/ai-employees";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AiEmployeesError } from "./ai-employees-error";
import { EmployeeChatPanel } from "./employee-chat-panel";
import { EmployeeDetailActions } from "./employee-detail-actions";
import { EmployeeDetailTabs, type EmployeeDetailTab } from "./employee-detail-tabs";
import { EmployeeKnowledgeAssignment } from "./employee-knowledge-assignment";
import { EmployeeProfilePanel } from "./employee-profile-panel";
import { EmployeeSetupChecklist } from "./employee-setup-checklist";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { EmployeeToolsAssignment } from "./employee-tools-assignment";
import { EmployeeDetailSkeleton } from "./employee-list-skeleton";
import { AiEmployeesStats } from "./ai-employees-stats";

interface AiEmployeeDetailPageProps {
  employeeId: string;
}

export function AiEmployeeDetailPage({ employeeId }: AiEmployeeDetailPageProps) {
  const accent = dashboardAccents.emerald;
  const [activeTab, setActiveTab] = useState<EmployeeDetailTab>("profile");
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.EMPLOYEES_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.EMPLOYEES_DELETE);
  const canChat = hasPermission(permissions, PERMISSIONS.EMPLOYEES_CHAT);

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(employeeId);

  if (isLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <EmployeeDetailSkeleton />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <AiEmployeesError
          title="Failed to load employee"
          message={getApiErrorMessage(error, "Could not load this AI employee.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!employee) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
        <Link href="/ai-employees">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            Back to AI Employees
          </Button>
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getEmployeeInitials(employee.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                AI Employee
              </p>
              <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
                {employee.name}
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">{employee.role}</p>
              <div className="mt-3">
                <EmployeeStatusBadge status={employee.status} />
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs shrink-0">
            <EmployeeDetailActions
              employee={employee}
              canManage={canWrite}
              canDelete={canDelete}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <AiEmployeesStats employees={[employee]} details={[employee]} />

        <EmployeeSetupChecklist employee={employee} />

        <EmployeeDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "profile" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <EmployeeProfilePanel employee={employee} canEdit={canWrite} />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2">
                <Bot className={cn("size-4", accent.text)} />
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                  Configuration summary
                </p>
              </div>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Knowledge documents</dt>
                  <dd className="font-medium text-foreground">
                    {employee.document_assignments.length}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Enabled tools</dt>
                  <dd className="font-medium text-foreground">
                    {employee.tools.filter((t) => t.is_enabled).length}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Chat ready</dt>
                  <dd className="font-medium text-foreground">
                    {employee.status === "active" &&
                    employee.document_assignments.length > 0
                      ? "Yes"
                      : "No"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "knowledge" && (
          <EmployeeKnowledgeAssignment employee={employee} canEdit={canWrite} />
        )}

        {activeTab === "tools" && (
          <EmployeeToolsAssignment employee={employee} canEdit={canWrite} />
        )}

        {activeTab === "chat" && (
          <EmployeeChatPanel employee={employee} canChat={canChat} />
        )}
      </div>
    </div>
  );
}

"use client";

import type { AIEmployee, AIEmployeeStatus } from "@/lib/ai-employees/types";

import { EmployeeCard } from "./employee-card";

interface EmployeeCardGridProps {
  employees: AIEmployee[];
  statusFilter?: AIEmployeeStatus | "all";
}

export function EmployeeCardGrid({
  employees,
  statusFilter = "all",
}: EmployeeCardGridProps) {
  const filtered =
    statusFilter === "all"
      ? employees
      : employees.filter((employee) => employee.status === statusFilter);

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-[14px] text-muted-foreground">
          No employees match this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}

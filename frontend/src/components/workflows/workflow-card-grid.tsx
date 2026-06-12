"use client";

import type { Workflow } from "@/lib/workflows/types";

import { WorkflowCard } from "./workflow-card";

interface WorkflowCardGridProps {
  workflows: Workflow[];
}

export function WorkflowCardGrid({ workflows }: WorkflowCardGridProps) {
  if (workflows.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No workflows match this filter.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}

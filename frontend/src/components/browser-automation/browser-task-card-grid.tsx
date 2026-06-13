"use client";

import type { BrowserProfile, BrowserTask } from "@/lib/browser-automation/types";

import { BrowserTaskCard } from "./browser-task-card";

interface BrowserTaskCardGridProps {
  tasks: BrowserTask[];
  profiles: BrowserProfile[];
}

export function BrowserTaskCardGrid({ tasks, profiles }: BrowserTaskCardGridProps) {
  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No tasks match this filter.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <BrowserTaskCard key={task.id} task={task} profiles={profiles} />
      ))}
    </div>
  );
}

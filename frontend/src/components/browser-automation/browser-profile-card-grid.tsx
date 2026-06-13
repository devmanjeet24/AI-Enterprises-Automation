"use client";

import type { BrowserProfile, BrowserTask } from "@/lib/browser-automation/types";

import { BrowserProfileCard } from "./browser-profile-card";

interface BrowserProfileCardGridProps {
  profiles: BrowserProfile[];
  tasks: BrowserTask[];
}

export function BrowserProfileCardGrid({ profiles, tasks }: BrowserProfileCardGridProps) {
  if (profiles.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No profiles match this filter.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {profiles.map((profile) => (
        <BrowserProfileCard key={profile.id} profile={profile} tasks={tasks} />
      ))}
    </div>
  );
}

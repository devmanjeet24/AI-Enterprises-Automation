"use client";

import type { ResearchProject } from "@/lib/research-hub/types";

import { ResearchProjectCard } from "./research-project-card";

interface ResearchProjectCardGridProps {
  projects: ResearchProject[];
}

export function ResearchProjectCardGrid({ projects }: ResearchProjectCardGridProps) {
  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No projects match this filter.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ResearchProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

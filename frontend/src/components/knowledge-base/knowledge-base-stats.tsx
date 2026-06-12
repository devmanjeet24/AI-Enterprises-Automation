"use client";

import { AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeDocumentStats } from "@/config/knowledge-base";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { KnowledgeBaseStatsSkeleton } from "./document-list-skeleton";

interface KnowledgeBaseStatsProps {
  documents: KnowledgeDocument[];
  isLoading?: boolean;
}

export function KnowledgeBaseStats({
  documents,
  isLoading = false,
}: KnowledgeBaseStatsProps) {
  if (isLoading) {
    return <KnowledgeBaseStatsSkeleton />;
  }

  const computed = computeDocumentStats(documents);

  const stats = [
    {
      label: "Total documents",
      value: computed.total,
      detail: "Across your organization",
      icon: FileText,
      accent: "purple" as const,
    },
    {
      label: "Embedded",
      value: computed.ready,
      detail: "Ready for AI Employees",
      icon: CheckCircle2,
      accent: "emerald" as const,
    },
    {
      label: "In pipeline",
      value: computed.inPipeline,
      detail: "Pending or processing",
      icon: Clock,
      accent: "gold" as const,
    },
    {
      label: "Failed",
      value: computed.failed,
      detail: "Require attention",
      icon: AlertCircle,
      accent: "blue" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const statAccent = dashboardAccents[stat.accent];
        const Icon = stat.icon;
        return (
          <DashboardCard
            key={stat.label}
            variant="kpi"
            accent={stat.accent}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg border",
                  statAccent.bgSubtle,
                  statAccent.border,
                )}
              >
                <Icon className={cn("size-3.5", statAccent.text)} />
              </div>
            </div>
            <p className="mt-3 font-display text-[2rem] leading-none tracking-[-0.02em] text-foreground">
              {stat.value}
            </p>
            <p className={cn("mt-2 text-[12px]", statAccent.textMuted)}>
              {stat.detail}
            </p>
          </DashboardCard>
        );
      })}
    </div>
  );
}

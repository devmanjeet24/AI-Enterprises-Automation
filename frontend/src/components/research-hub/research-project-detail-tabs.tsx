"use client";

import { cn } from "@/lib/utils";

export type ResearchProjectDetailTab = "overview" | "reports" | "history";

const tabs: { id: ResearchProjectDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports" },
  { id: "history", label: "History" },
];

interface ResearchProjectDetailTabsProps {
  activeTab: ResearchProjectDetailTab;
  onTabChange: (tab: ResearchProjectDetailTab) => void;
  reportCount?: number;
  historyCount?: number;
}

export function ResearchProjectDetailTabs({
  activeTab,
  onTabChange,
  reportCount,
  historyCount,
}: ResearchProjectDetailTabsProps) {
  const tabLabels: Record<ResearchProjectDetailTab, string> = {
    overview: "Overview",
    reports:
      reportCount != null && reportCount > 0
        ? `Reports (${reportCount})`
        : "Reports",
    history:
      historyCount != null && historyCount > 0
        ? `History (${historyCount})`
        : "History",
  };

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors",
            activeTab === tab.id
              ? "bg-white/[0.08] text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tabLabels[tab.id]}
        </button>
      ))}
    </div>
  );
}

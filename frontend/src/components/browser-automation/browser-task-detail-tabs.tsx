"use client";

import { cn } from "@/lib/utils";

export type BrowserTaskDetailTab = "overview" | "history";

const tabs: { id: BrowserTaskDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
];

interface BrowserTaskDetailTabsProps {
  activeTab: BrowserTaskDetailTab;
  onTabChange: (tab: BrowserTaskDetailTab) => void;
  historyCount?: number;
}

export function BrowserTaskDetailTabs({
  activeTab,
  onTabChange,
  historyCount,
}: BrowserTaskDetailTabsProps) {
  const tabLabels: Record<BrowserTaskDetailTab, string> = {
    overview: "Overview",
    history:
      historyCount != null && historyCount > 0 ? `History (${historyCount})` : "History",
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

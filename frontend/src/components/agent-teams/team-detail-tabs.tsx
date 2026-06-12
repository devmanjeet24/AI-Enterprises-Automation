"use client";

import { cn } from "@/lib/utils";

export type TeamDetailTab = "configure" | "members" | "execute" | "history";

const tabs: { id: TeamDetailTab; label: string }[] = [
  { id: "configure", label: "Configure" },
  { id: "members", label: "Members" },
  { id: "execute", label: "Execute" },
  { id: "history", label: "History" },
];

interface TeamDetailTabsProps {
  activeTab: TeamDetailTab;
  onTabChange: (tab: TeamDetailTab) => void;
}

export function TeamDetailTabs({ activeTab, onTabChange }: TeamDetailTabsProps) {
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
          {tab.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { buildExecutionSummaryItems } from "@/lib/browser-automation/execution-helpers";
import type { BrowserTaskExecution } from "@/lib/browser-automation/types";

interface BrowserExecutionSummaryProps {
  execution: BrowserTaskExecution;
}

export function BrowserExecutionSummary({ execution }: BrowserExecutionSummaryProps) {
  const items = buildExecutionSummaryItems(execution);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-tertiary">
        Execution summary
      </p>
      <dl className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-[12px] text-muted-foreground">{item.label}</dt>
            <dd className="text-[13px] font-medium leading-relaxed text-foreground sm:text-right">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

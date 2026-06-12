"use client";

import { Calculator, Loader2, Save, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { toolCatalog } from "@/config/ai-employees";
import { useReplaceEmployeeTools } from "@/hooks/use-ai-employees";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AIEmployeeDetail } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

const toolIcons: Record<string, typeof Search> = {
  knowledge_search: Search,
  calculator: Calculator,
};

interface EmployeeToolsAssignmentProps {
  employee: AIEmployeeDetail;
  canEdit?: boolean;
}

export function EmployeeToolsAssignment({
  employee,
  canEdit = true,
}: EmployeeToolsAssignmentProps) {
  const accent = dashboardAccents.emerald;
  const toast = useToast();
  const replaceMutation = useReplaceEmployeeTools(employee.id);

  const initialEnabled = new Set(
    employee.tools.filter((t) => t.is_enabled).map((t) => t.tool_slug),
  );
  const [enabledSlugs, setEnabledSlugs] = useState<Set<string>>(initialEnabled);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEnabledSlugs(
      new Set(employee.tools.filter((t) => t.is_enabled).map((t) => t.tool_slug)),
    );
    setHasChanges(false);
  }, [employee.tools]);

  const toggleTool = (slug: string) => {
    if (!canEdit) return;
    setEnabledSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const tools = [...enabledSlugs].map((slug) => ({
        tool_slug: slug,
        is_enabled: true,
      }));
      await replaceMutation.mutateAsync(tools);
      toast.success("Tool assignments saved.");
      setHasChanges(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save tool assignments."));
    }
  };

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Tools
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Enable capabilities this employee can use during chat and agent tasks.
          </p>
        </div>
        {canEdit && (
          <Button
            variant="brand"
            size="sm"
            disabled={!hasChanges || replaceMutation.isPending}
            onClick={handleSave}
          >
            {replaceMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Save
          </Button>
        )}
      </div>

      <ul className="mt-5 space-y-2">
        {toolCatalog.map((tool) => {
          const Icon = toolIcons[tool.slug] ?? Search;
          const isEnabled = enabledSlugs.has(tool.slug);
          return (
            <li key={tool.slug}>
              <button
                type="button"
                disabled={!canEdit || replaceMutation.isPending}
                onClick={() => toggleTool(tool.slug)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  isEnabled
                    ? cn(accent.bgSubtle, accent.border)
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]",
                  !canEdit && "cursor-default opacity-80",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    isEnabled ? cn(accent.bgSubtle, accent.border) : "border-white/[0.08]",
                  )}
                >
                  <Icon className={cn("size-4", isEnabled ? accent.text : "text-tertiary")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-foreground">{tool.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{tool.description}</p>
                </div>
                <div
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
                    isEnabled
                      ? "border-success/40 bg-success/20"
                      : "border-white/[0.12] bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                      isEnabled ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

"use client";

import {
  BarChart3,
  Building2,
  Grid2x2,
  Loader2,
  Plus,
  Search,
  Swords,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyProjectName } from "@/config/research-hub";
import {
  useCreateResearchProject,
  useResearchTemplates,
} from "@/hooks/use-research-projects";
import { useAssignableAgentTeams } from "@/hooks/use-workflows";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import type { ResearchTemplateType } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const templateIcons: Record<ResearchTemplateType, typeof Search> = {
  market_research: BarChart3,
  competitor_analysis: Swords,
  industry_analysis: Building2,
  swot_analysis: Grid2x2,
};

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateResearchProject();
  const { data: templates = [], isLoading: isLoadingTemplates } =
    useResearchTemplates();
  const { data: assignableTeams = [], isLoading: isLoadingTeams } =
    useAssignableAgentTeams();

  const accent = dashboardAccents.purple;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [researchBrief, setResearchBrief] = useState("");
  const [templateType, setTemplateType] = useState<ResearchTemplateType | "">("");
  const [agentTeamId, setAgentTeamId] = useState("");

  const availableTeams = assignableTeams.filter(
    (team) => team.is_active && team.member_count > 0,
  );

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setResearchBrief("");
    setTemplateType("");
    setAgentTeamId("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createMutation.isPending) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, createMutation.isPending]);

  useEffect(() => {
    if (templates.length > 0 && !templateType) {
      setTemplateType(templates[0].template_type);
    }
  }, [templates, templateType]);

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!templateType) return;

    await runMutationWithFeedback({
      action: () =>
        createMutation.mutateAsync({
          name: name.trim(),
          slug: slugifyProjectName(name),
          description: description.trim() || undefined,
          research_brief: researchBrief.trim(),
          template_type: templateType,
          agent_team_id: agentTeamId,
        }),
      toast,
      successMessage: (project) =>
        `Research project "${project.name}" created successfully.`,
      errorFallback: "Failed to create research project.",
      onSuccess: (project) => {
        resetForm();
        onClose();
        router.push(`/research-hub/${project.id}`);
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close create project modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={createMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0c1220]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(167,139,250,0.4) 50%, transparent)",
          }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <Search className={cn("size-5", accent.text)} />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Research Hub
              </p>
              <h2
                id="create-project-title"
                className="mt-0.5 text-lg font-medium tracking-[-0.02em] text-foreground"
              >
                Create research project
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Projects start as draft. Run research from the project detail after creation.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Q2 Market Landscape"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <textarea
              id="project-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="What is this research project about?"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-brief">Research brief</Label>
            <textarea
              id="project-brief"
              rows={4}
              value={researchBrief}
              onChange={(e) => setResearchBrief(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="Describe the research goals, scope, audience, and key questions to answer…"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
            <p className="text-[11px] text-tertiary">
              Guides every step of the agent team research pipeline.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Methodology template</Label>
            {isLoadingTemplates ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((template) => {
                  const Icon = templateIcons[template.template_type];
                  const isSelected = templateType === template.template_type;
                  return (
                    <button
                      key={template.template_type}
                      type="button"
                      onClick={() => setTemplateType(template.template_type)}
                      disabled={createMutation.isPending}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        isSelected
                          ? cn(accent.bgSubtle, accent.border, "ring-1 ring-[#A78BFA]/30")
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                            isSelected
                              ? cn(accent.bgSubtle, accent.border)
                              : "border-white/[0.08] bg-white/[0.03]",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-3.5",
                              isSelected ? accent.text : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground">
                            {template.name}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                            {template.description}
                          </p>
                          <p className="mt-1.5 text-[10px] text-tertiary">
                            {template.steps.length} steps
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-team">Agent team</Label>
            <select
              id="project-team"
              value={agentTeamId}
              onChange={(e) => setAgentTeamId(e.target.value)}
              disabled={createMutation.isPending || isLoadingTeams}
              className={cn(
                "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">
                {isLoadingTeams ? "Loading teams…" : "Select agent team…"}
              </option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} — {team.member_count} member
                  {team.member_count === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-tertiary">
              Must be an active team with at least one member.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled={
              !name.trim() ||
              !researchBrief.trim() ||
              !templateType ||
              !agentTeamId ||
              createMutation.isPending ||
              availableTeams.length === 0
            }
            onClick={handleCreate}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {createMutation.isPending ? "Creating…" : "Create project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

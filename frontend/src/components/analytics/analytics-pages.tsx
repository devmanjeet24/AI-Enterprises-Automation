"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Bot,
  GitBranch,
  Globe,
  Info,
  Layers,
  Lock,
  Network,
  Search,
  Shield,
  Users,
} from "lucide-react";

import { DashboardCard, DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  analyticsNavAccents,
  analyticsNavIcons,
  buildBrowserExecutionChart,
  buildBrowserKpis,
  buildBrowserTaskStatusChart,
  buildAgentTeamsActivityChart,
  buildAgentTeamsByTeamChart,
  buildAgentTeamsHeroStats,
  buildAgentTeamsInsights,
  buildAgentTeamsKpis,
  buildAgentTeamsStatusChart,
  buildAIEmployeesCapabilityChart,
  buildAIEmployeesHeroStats,
  buildAIEmployeesInsights,
  buildAIEmployeesKpis,
  buildAIEmployeesRoleChart,
  buildAIEmployeesStatusChart,
  buildExecutiveHeroStats,
  buildExecutiveKpis,
  buildExecutivePlatformMetrics,
  buildKnowledgeChunkChart,
  buildKnowledgeHeroStats,
  buildKnowledgeInsights,
  buildKnowledgeKpis,
  buildKnowledgePipelineChart,
  buildKnowledgeStatusChart,
  buildKnowledgeStorageChart,
  buildKnowledgeTypeChart,
  buildOrganizationDepartmentStatusChart,
  buildOrganizationGrowthChart,
  buildOrganizationHeroStats,
  buildOrganizationInsights,
  buildOrganizationKpis,
  buildOrganizationTeamsByDepartmentChart,
  buildOrganizationUserStatusChart,
  buildOrganizationUsersByRoleChart,
  buildOrganizationWorkspaceChart,
  buildReportsActivityChart,
  buildReportsHeroStats,
  buildReportsInsights,
  buildReportsKpis,
  buildReportsStatusChart,
  buildResearchKpis,
  buildResearchReportsChart,
  buildResearchStatusChart,
  buildResearchTemplateChart,
  buildWorkflowExecutionsChart,
  buildWorkflowsActivityChart,
  buildWorkflowsHeroStats,
  buildWorkflowsInsights,
  buildWorkflowsKpis,
  buildWorkflowsStatusChart,
  formatAIEmployeeSecondaryMetrics,
  formatAnalyticsValue,
  formatKnowledgeSecondaryMetrics,
  formatWorkflowSecondaryMetrics,
  getAnalyticsSectionById,
} from "@/config/analytics";
import { useAuthUser } from "@/hooks/use-auth-token";
import {
  useBrowserAnalytics,
  useExecutiveAnalytics,
  useResearchAnalytics,
  useAgentTeamsAnalytics,
  useWorkflowsAnalytics,
  useAIEmployeesAnalytics,
  useReportsAnalytics,
} from "@/hooks/use-analytics";
import { useKnowledgeAnalytics } from "@/hooks/use-knowledge-analytics";
import { useOrganizationAnalytics } from "@/hooks/use-organization-analytics";
import { getApiErrorMessage } from "@/lib/api/errors";
import { isAnalyticsAccessDeniedError } from "@/lib/analytics/access";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AnalyticsAccessDenied } from "./analytics-access-denied";
import { AnalyticsBarChart, AnalyticsDistributionChart } from "./analytics-charts";
import { AnalyticsEmployeeRosterTable } from "./analytics-employee-roster-table";
import { AnalyticsHero } from "./analytics-hero";
import {
  AnalyticsInsightsPanel,
  AnalyticsRestrictedPanel,
} from "./analytics-insights";
import { AnalyticsKpiGrid } from "./analytics-kpi-grid";
import { AnalyticsLayout } from "./analytics-layout";
import { AnalyticsRecentDocumentsTable } from "./analytics-recent-documents-table";
import { AnalyticsRecentTasksTable } from "./analytics-recent-tasks-table";
import { AnalyticsReportsTable } from "./analytics-reports-table";
import { AnalyticsPageSkeleton } from "./analytics-skeleton";
import { AnalyticsStructureTable } from "./analytics-structure-table";
import { AnalyticsSubNav } from "./analytics-sub-nav";
import { AnalyticsWorkflowRunsTable } from "./analytics-workflow-runs-table";

function ModuleSnapshotCard({
  title,
  description,
  href,
  accentKey,
  metrics,
  restricted = false,
}: {
  title: string;
  description: string;
  href: string;
  accentKey: "purple" | "blue";
  metrics: { label: string; value: string }[];
  restricted?: boolean;
}) {
  const accent = dashboardAccents[accentKey];

  return (
    <DashboardCard variant="default" accent={accentKey} className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-medium tracking-[-0.01em] text-foreground">{title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {restricted && <Lock className="size-4 shrink-0 text-tertiary" />}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <p className="text-[12px] text-muted-foreground">{metric.label}</p>
            <p className="mt-1 font-display text-lg leading-none tracking-[-0.02em] text-foreground">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {!restricted && (
        <div className="mt-5 flex items-center justify-end border-t border-white/[0.06] pt-4">
          <Link
            href={href}
            className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}
          >
            View details
            <ArrowRight className="size-3" />
          </Link>
        </div>
      )}
    </DashboardCard>
  );
}

export function AnalyticsExecutivePage() {
  const user = useAuthUser();
  const organizationName = user?.organization_name ?? "your organization";

  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useExecutiveAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const errorMessage = isError
    ? getApiErrorMessage(error, "Could not load executive analytics.")
    : null;

  const heroStats = snapshot ? buildExecutiveHeroStats(snapshot) : [];
  const kpis = buildExecutiveKpis(snapshot?.overview);
  const platformMetrics = buildExecutivePlatformMetrics(snapshot?.overview);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        title={
          <>
            Executive{" "}
            <span className={dashboardAccents.emerald.text}>dashboard</span>
          </>
        }
        description={`Cross-module KPIs and activity snapshots for ${organizationName}.`}
        stats={heroStats}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        <section>
          <DashboardSectionHeader
            eyebrow="Overview"
            title="Organization KPIs"
            description="High-level counts across users, agents, workflows, and automation modules."
          />
          <AnalyticsKpiGrid
            items={kpis}
            icons={[Users, Bot, GitBranch, Search]}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={() => void refetch()}
          />
        </section>

        <section>
          <DashboardSectionHeader
            eyebrow="Platform"
            title="Module distribution"
            description="Relative volume across knowledge, agent tasks, workflows, research, and browser automation."
          />
          <AnalyticsDistributionChart
            title="Resource counts"
            segments={platformMetrics}
            accent="emerald"
            isLoading={isLoading}
            emptyMessage="Overview metrics will appear once data is available."
          />
        </section>

        <section>
          <DashboardSectionHeader
            eyebrow="Modules"
            title="Activity snapshots"
            description="Quick views into research and browser automation performance."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleSnapshotCard
              title="Research Hub"
              description="Project portfolio, report completion, and recent run activity."
              href="/analytics/research"
              accentKey="purple"
              restricted={snapshot?.researchAccessDenied}
              metrics={[
                {
                  label: "Total projects",
                  value: snapshot?.researchAvailable
                    ? formatAnalyticsValue(snapshot.research?.total_projects)
                    : snapshot?.researchAccessDenied
                      ? "Restricted"
                      : "—",
                },
                {
                  label: "Reports completed",
                  value: snapshot?.researchAvailable
                    ? formatAnalyticsValue(snapshot.research?.completed_reports)
                    : snapshot?.researchAccessDenied
                      ? "Restricted"
                      : "—",
                },
                {
                  label: "Runs (7 days)",
                  value: snapshot?.researchAvailable
                    ? formatAnalyticsValue(snapshot.research?.recent_runs_7d)
                    : snapshot?.researchAccessDenied
                      ? "Restricted"
                      : "—",
                },
                {
                  label: "Failed reports",
                  value: snapshot?.researchAvailable
                    ? formatAnalyticsValue(snapshot.research?.failed_reports)
                    : snapshot?.researchAccessDenied
                      ? "Restricted"
                      : "—",
                },
              ]}
            />
            <ModuleSnapshotCard
              title="Browser Automation"
              description="Profiles, tasks, execution success, and recent run volume."
              href="/analytics/browser-automation"
              accentKey="blue"
              restricted={snapshot?.browserAccessDenied}
              metrics={[
                {
                  label: "Browser profiles",
                  value: snapshot?.browserAvailable
                    ? formatAnalyticsValue(snapshot.browser?.total_profiles)
                    : snapshot?.browserAccessDenied
                      ? "Restricted"
                      : "—",
                },
                {
                  label: "Automation tasks",
                  value: snapshot?.browserAvailable
                    ? formatAnalyticsValue(snapshot.browser?.total_tasks)
                    : snapshot?.browserAccessDenied
                      ? "Restricted"
                      : "—",
                },
                {
                  label: "Runs (7 days)",
                  value: snapshot?.browserAvailable
                    ? formatAnalyticsValue(snapshot.browser?.recent_executions_7d)
                    : snapshot?.browserAccessDenied
                      ? "Restricted"
                      : "—",
                },
                {
                  label: "Failed executions",
                  value: snapshot?.browserAvailable
                    ? formatAnalyticsValue(snapshot.browser?.failed_executions)
                    : snapshot?.browserAccessDenied
                      ? "Restricted"
                      : "—",
                },
              ]}
            />
          </div>
        </section>
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsResearchPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useResearchAnalytics();

  const accessDenied = isError && isAnalyticsAccessDeniedError(error);
  const errorMessage = isError && !accessDenied
    ? getApiErrorMessage(error, "Could not load research analytics.")
    : null;

  if (isLoading && !analytics) {
    return <AnalyticsPageSkeleton />;
  }

  const heroStats = analytics
    ? [
        { label: "Projects", value: formatAnalyticsValue(analytics.total_projects) },
        { label: "Active", value: formatAnalyticsValue(analytics.active_projects) },
        { label: "Reports done", value: formatAnalyticsValue(analytics.completed_reports) },
        { label: "Runs (7d)", value: formatAnalyticsValue(analytics.recent_runs_7d) },
      ]
    : [];

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Research"
        title={
          <>
            Research{" "}
            <span className={dashboardAccents.purple.text}>analytics</span>
          </>
        }
        description="Project portfolio health, template mix, report outcomes, and recent execution volume."
        stats={heroStats}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {accessDenied ? (
          <AnalyticsAccessDenied
            title="Research analytics unavailable"
            message="You need research project read permission to view these metrics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Portfolio"
                title="Key metrics"
                description="Aggregate counts for projects, reports, and recent research runs."
              />
              <AnalyticsKpiGrid
                items={buildResearchKpis(analytics)}
                icons={[Search, CheckCircle2, FileText, ClipboardList]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsBarChart
                title="Projects by status"
                subtitle="Draft, active, and archived breakdown"
                segments={buildResearchStatusChart(analytics)}
                accent="purple"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Projects by template"
                subtitle="Research methodology distribution"
                segments={buildResearchTemplateChart(analytics)}
                accent="purple"
                isLoading={isLoading}
              />
            </section>

            <section>
              <AnalyticsDistributionChart
                title="Reports by status"
                subtitle="Pipeline and completion outcomes"
                segments={buildResearchReportsChart(analytics)}
                accent="blue"
                isLoading={isLoading}
              />
            </section>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsBrowserAutomationPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useBrowserAnalytics();

  const accessDenied = isError && isAnalyticsAccessDeniedError(error);
  const errorMessage = isError && !accessDenied
    ? getApiErrorMessage(error, "Could not load browser automation analytics.")
    : null;

  if (isLoading && !analytics) {
    return <AnalyticsPageSkeleton />;
  }

  const heroStats = analytics
    ? [
        { label: "Profiles", value: formatAnalyticsValue(analytics.total_profiles) },
        { label: "Tasks", value: formatAnalyticsValue(analytics.total_tasks) },
        { label: "Completed", value: formatAnalyticsValue(analytics.completed_executions) },
        { label: "Runs (7d)", value: formatAnalyticsValue(analytics.recent_executions_7d) },
      ]
    : [];

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Browser"
        title={
          <>
            Browser automation{" "}
            <span className={dashboardAccents.blue.text}>analytics</span>
          </>
        }
        description="Profile inventory, task readiness, execution outcomes, and recent run activity."
        stats={heroStats}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {accessDenied ? (
          <AnalyticsAccessDenied
            title="Browser analytics unavailable"
            message="You need browser task read permission to view these metrics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Automation"
                title="Key metrics"
                description="Profiles, tasks, executions, and recent browser run volume."
              />
              <AnalyticsKpiGrid
                items={buildBrowserKpis(analytics)}
                icons={[Globe, Layers, CheckCircle2, ClipboardList]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsBarChart
                title="Tasks by status"
                subtitle="Draft, ready, and archived tasks"
                segments={buildBrowserTaskStatusChart(analytics)}
                accent="blue"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Executions by status"
                subtitle="Run lifecycle and outcomes"
                segments={buildBrowserExecutionChart(analytics)}
                accent="blue"
                isLoading={isLoading}
              />
            </section>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsOrganizationPage() {
  const user = useAuthUser();
  const organizationName = user?.organization_name ?? "your organization";

  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganizationAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const errorMessage = isError
    ? getApiErrorMessage(error, "Could not load organization analytics.")
    : null;

  const metrics = snapshot?.metrics;
  const departmentNames = new Map(
    (snapshot?.departments ?? []).map((department) => [
      department.id,
      department.name,
    ]),
  );

  const heroStats = buildOrganizationHeroStats(metrics);
  const kpis = buildOrganizationKpis(metrics);
  const insights = buildOrganizationInsights(metrics);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Organization"
        title={
          <>
            Organization{" "}
            <span className={dashboardAccents.neutral.text}>analytics</span>
          </>
        }
        description={`Workspace structure, membership, and RBAC metrics for ${organizationName}.`}
        stats={heroStats}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        <section>
          <DashboardSectionHeader
            eyebrow="Workspace"
            title="Organization KPIs"
            description="Member counts, org structure, and role coverage derived from workspace settings data."
          />
          <AnalyticsKpiGrid
            items={kpis}
            icons={[Users, Building2, Shield, ClipboardList]}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={() => void refetch()}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsDistributionChart
            title="Workspace resources"
            subtitle="Users, departments, teams, roles, and permissions"
            segments={buildOrganizationWorkspaceChart(metrics)}
            accent="neutral"
            isLoading={isLoading}
            emptyMessage="Resource counts will appear once workspace data is available."
          />
          <AnalyticsBarChart
            title="Member growth"
            subtitle="New members by recent time windows"
            segments={buildOrganizationGrowthChart(metrics)}
            accent="blue"
            isLoading={isLoading}
            emptyMessage={
              snapshot?.usersAccessDenied
                ? "Member growth requires users read permission."
                : "No recent member signups yet."
            }
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {snapshot?.usersAccessDenied ? (
            <div className="lg:col-span-2">
              <AnalyticsRestrictedPanel
                title="Member metrics restricted"
                message="You need users read permission to view member status and role distribution."
              />
            </div>
          ) : (
            <>
              <AnalyticsDistributionChart
                title="Members by status"
                subtitle="Active vs inactive accounts"
                segments={buildOrganizationUserStatusChart(metrics)}
                accent="blue"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Members by role"
                subtitle="Role assignment distribution"
                segments={buildOrganizationUsersByRoleChart(metrics)}
                accent="blue"
                isLoading={isLoading}
              />
            </>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {snapshot?.departmentsAccessDenied || snapshot?.teamsAccessDenied ? (
            <div className="lg:col-span-2">
              <AnalyticsRestrictedPanel
                title="Structure metrics restricted"
                message="You need departments and teams read permission to view org structure charts."
              />
            </div>
          ) : (
            <>
              <AnalyticsDistributionChart
                title="Departments by status"
                subtitle="Active vs inactive departments"
                segments={buildOrganizationDepartmentStatusChart(metrics)}
                accent="neutral"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Teams by department"
                subtitle="Team count per department"
                segments={buildOrganizationTeamsByDepartmentChart(
                  metrics,
                  departmentNames,
                )}
                accent="emerald"
                isLoading={isLoading}
              />
            </>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {snapshot?.departmentsAccessDenied ? (
              <AnalyticsRestrictedPanel
                title="Structure table restricted"
                message="You need departments read permission to view the workspace structure table."
              />
            ) : (
              <AnalyticsStructureTable
                rows={metrics?.structureRows ?? []}
                isLoading={isLoading}
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <AnalyticsInsightsPanel
              insights={insights}
              accent="neutral"
              isLoading={isLoading}
            />
          </div>
        </section>

        {snapshot &&
          (snapshot.usersAccessDenied ||
            snapshot.departmentsAccessDenied ||
            snapshot.teamsAccessDenied ||
            snapshot.rolesAccessDenied ||
            snapshot.permissionsAccessDenied) && (
            <DashboardCard
              variant="panel"
              accent="gold"
              interactive={false}
              className="flex items-start gap-3 p-5"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Some organization metrics are hidden because of missing read
                permissions. Overview counts still reflect organization-wide
                totals where available.
              </p>
            </DashboardCard>
          )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsKnowledgePage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useKnowledgeAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const accessDenied = snapshot?.accessDenied ?? false;
  const errorMessage =
    isError && !accessDenied
      ? getApiErrorMessage(error, "Could not load knowledge analytics.")
      : null;

  const metrics = snapshot?.metrics;
  const heroStats = buildKnowledgeHeroStats(metrics);
  const secondaryMetrics = formatKnowledgeSecondaryMetrics(metrics);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Knowledge"
        title={
          <>
            Knowledge{" "}
            <span className={dashboardAccents.purple.text}>analytics</span>
          </>
        }
        description="Document corpus health, ingestion pipeline status, and embedding coverage across your knowledge base."
        stats={heroStats}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {accessDenied ? (
          <AnalyticsAccessDenied
            title="Knowledge analytics unavailable"
            message="You need documents read permission to view knowledge base analytics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Corpus"
                title="Knowledge KPIs"
                description="Document counts, pipeline volume, storage footprint, and indexing coverage."
              />
              <AnalyticsKpiGrid
                items={buildKnowledgeKpis(metrics)}
                icons={[BookOpen, CheckCircle2, Layers, FileText]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {secondaryMetrics.map((item) => (
                  <DashboardCard
                    key={item.label}
                    variant="default"
                    accent="purple"
                    interactive={false}
                    className="p-4"
                  >
                    <p className="text-[12px] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                      {item.value}
                    </p>
                  </DashboardCard>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsDistributionChart
                title="Documents by status"
                subtitle="Processing pipeline distribution"
                segments={buildKnowledgeStatusChart(metrics)}
                accent="purple"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Ingestion pipeline"
                subtitle="Pending through failed stages"
                segments={buildKnowledgePipelineChart(metrics)}
                accent="purple"
                isLoading={isLoading}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsBarChart
                title="Documents by type"
                subtitle="Corpus composition"
                segments={buildKnowledgeTypeChart(metrics)}
                accent="blue"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Chunk distribution"
                subtitle="Documents grouped by chunk count"
                segments={buildKnowledgeChunkChart(metrics)}
                accent="blue"
                isLoading={isLoading}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsBarChart
                title="Storage by status"
                subtitle="Approximate storage per pipeline stage (KB)"
                segments={buildKnowledgeStorageChart(metrics)}
                accent="gold"
                isLoading={isLoading}
              />
              <AnalyticsInsightsPanel
                title="Corpus insights"
                subtitle="Highlights from document processing metrics"
                insights={buildKnowledgeInsights(metrics)}
                accent="purple"
                isLoading={isLoading}
              />
            </section>

            <section>
              <AnalyticsRecentDocumentsTable
                documents={metrics?.recentDocuments ?? []}
                isLoading={isLoading}
              />
            </section>

            <DashboardCard
              variant="panel"
              accent="neutral"
              interactive={false}
              className="flex items-start gap-3 p-5"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
              <div>
                <p className="text-[14px] font-medium text-foreground">
                  Query activity not tracked
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Knowledge search and RAG query volume is not logged by the
                  current API. Corpus metrics above are computed from document
                  records only.
                </p>
              </div>
            </DashboardCard>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsAgentTeamsPage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useAgentTeamsAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const fullyDenied =
    snapshot?.teamsAccessDenied && snapshot?.tasksAccessDenied;
  const errorMessage =
    isError && !fullyDenied
      ? getApiErrorMessage(error, "Could not load agent teams analytics.")
      : null;

  const metrics = snapshot?.metrics;
  const teamNames = new Map(
    (snapshot?.teams ?? []).map((team) => [team.id, team.name]),
  );

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Agent Teams"
        title={
          <>
            Agent teams{" "}
            <span className={dashboardAccents.blue.text}>analytics</span>
          </>
        }
        description="Multi-agent roster composition, task volume, and completion outcomes derived from team and task records."
        stats={buildAgentTeamsHeroStats(metrics)}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {fullyDenied ? (
          <AnalyticsAccessDenied
            title="Agent teams analytics unavailable"
            message="You need agent teams read permission to view these metrics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Teams"
                title="Key metrics"
                description="Team inventory, member coverage, and task completion derived from existing APIs."
              />
              <AnalyticsKpiGrid
                items={buildAgentTeamsKpis(metrics)}
                icons={[Network, Users, ClipboardList, CheckCircle2]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {snapshot?.tasksAccessDenied ? (
                <div className="lg:col-span-2">
                  <AnalyticsRestrictedPanel
                    title="Task metrics restricted"
                    message="You need agent teams read permission to view task status and activity charts."
                  />
                </div>
              ) : (
                <>
                  <AnalyticsDistributionChart
                    title="Tasks by status"
                    subtitle="Pending through cancelled outcomes"
                    segments={buildAgentTeamsStatusChart(metrics)}
                    accent="blue"
                    isLoading={isLoading}
                  />
                  <AnalyticsBarChart
                    title="Task activity"
                    subtitle="Recent volume and outcome counts"
                    segments={buildAgentTeamsActivityChart(metrics)}
                    accent="blue"
                    isLoading={isLoading}
                  />
                </>
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {snapshot?.tasksAccessDenied || snapshot?.teamsAccessDenied ? (
                <div className="lg:col-span-2">
                  <AnalyticsRestrictedPanel
                    title="Team breakdown restricted"
                    message="You need teams and tasks read permission to view per-team task distribution."
                  />
                </div>
              ) : (
                <AnalyticsBarChart
                  title="Tasks by team"
                  subtitle="Task volume per agent team"
                  segments={buildAgentTeamsByTeamChart(metrics, teamNames)}
                  accent="purple"
                  isLoading={isLoading}
                  emptyMessage="Tasks will appear once teams start running work."
                />
              )}
              <AnalyticsInsightsPanel
                title="Team insights"
                subtitle="Highlights from team and task metrics"
                insights={buildAgentTeamsInsights(metrics)}
                accent="blue"
                isLoading={isLoading}
              />
            </section>

            <section>
              {snapshot?.tasksAccessDenied ? (
                <AnalyticsRestrictedPanel
                  title="Recent tasks restricted"
                  message="You need agent teams read permission to view recent task activity."
                />
              ) : (
                <AnalyticsRecentTasksTable
                  tasks={metrics?.recentTasks ?? []}
                  teamNames={teamNames}
                  isLoading={isLoading}
                />
              )}
            </section>

            <DashboardCard
              variant="panel"
              accent="neutral"
              interactive={false}
              className="flex items-start gap-3 p-5"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
              <div>
                <p className="text-[14px] font-medium text-foreground">
                  Execution-level metrics not available
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Per-step execution timing, skip rates, and employee-level
                  performance require task detail endpoints. Task list summaries
                  do not include execution arrays.
                </p>
              </div>
            </DashboardCard>

            {snapshot &&
              (snapshot.teamsAccessDenied ||
                snapshot.tasksAccessDenied ||
                snapshot.membersAccessDenied) && (
                <DashboardCard
                  variant="panel"
                  accent="gold"
                  interactive={false}
                  className="flex items-start gap-3 p-5"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Some agent team metrics are hidden because of missing read
                    permissions. Overview task counts still reflect
                    organization-wide totals where available.
                  </p>
                </DashboardCard>
              )}
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsWorkflowsPage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkflowsAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const fullyDenied = snapshot?.workflowsAccessDenied;
  const errorMessage =
    isError && !fullyDenied
      ? getApiErrorMessage(error, "Could not load workflow analytics.")
      : null;

  const metrics = snapshot?.metrics;
  const workflowNames = new Map(
    (snapshot?.workflows ?? []).map((workflow) => [workflow.id, workflow.name]),
  );
  const secondaryMetrics = formatWorkflowSecondaryMetrics(metrics);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Workflows"
        title={
          <>
            Workflow{" "}
            <span className={dashboardAccents.purple.text}>analytics</span>
          </>
        }
        description="Pipeline inventory, execution outcomes, and throughput computed from workflow and per-workflow execution history."
        stats={buildWorkflowsHeroStats(metrics)}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {fullyDenied ? (
          <AnalyticsAccessDenied
            title="Workflow analytics unavailable"
            message="You need workflows read permission to view these metrics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Pipelines"
                title="Key metrics"
                description="Workflow counts, step inventory, and execution success rates."
              />
              <AnalyticsKpiGrid
                items={buildWorkflowsKpis(metrics)}
                icons={[GitBranch, Layers, ClipboardList, CheckCircle2]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {secondaryMetrics.map((item) => (
                  <DashboardCard
                    key={item.label}
                    variant="default"
                    accent="purple"
                    interactive={false}
                    className="p-4"
                  >
                    <p className="text-[12px] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                      {item.value}
                    </p>
                  </DashboardCard>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsDistributionChart
                title="Workflows by status"
                subtitle="Draft, active, and archived pipelines"
                segments={buildWorkflowsStatusChart(metrics)}
                accent="purple"
                isLoading={isLoading}
              />
              {snapshot?.executionsAccessDenied ? (
                <AnalyticsRestrictedPanel
                  title="Execution metrics restricted"
                  message="You need workflows read permission to view execution status charts."
                />
              ) : (
                <AnalyticsDistributionChart
                  title="Executions by status"
                  subtitle="Run lifecycle and outcomes"
                  segments={buildWorkflowExecutionsChart(metrics)}
                  accent="blue"
                  isLoading={isLoading}
                  emptyMessage="Execution history will appear after workflows are run."
                />
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {snapshot?.executionsAccessDenied ? (
                <div className="lg:col-span-2">
                  <AnalyticsRestrictedPanel
                    title="Run activity restricted"
                    message="You need workflows read permission to view execution activity charts."
                  />
                </div>
              ) : (
                <AnalyticsBarChart
                  title="Run activity"
                  subtitle="Recent execution volume and outcomes"
                  segments={buildWorkflowsActivityChart(metrics)}
                  accent="purple"
                  isLoading={isLoading}
                />
              )}
              <AnalyticsInsightsPanel
                title="Pipeline insights"
                subtitle="Highlights from workflow execution metrics"
                insights={buildWorkflowsInsights(metrics)}
                accent="purple"
                isLoading={isLoading}
              />
            </section>

            <section>
              {snapshot?.executionsAccessDenied ? (
                <AnalyticsRestrictedPanel
                  title="Recent runs restricted"
                  message="You need workflows read permission to view recent execution history."
                />
              ) : (
                <AnalyticsWorkflowRunsTable
                  executions={metrics?.recentExecutions ?? []}
                  workflowNames={workflowNames}
                  isLoading={isLoading}
                />
              )}
            </section>

            <DashboardCard
              variant="panel"
              accent="neutral"
              interactive={false}
              className="flex items-start gap-3 p-5"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
              <div>
                <p className="text-[14px] font-medium text-foreground">
                  No global execution list
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Execution metrics are aggregated by fetching per-workflow
                  history endpoints. Step-level success rates and scheduled run
                  tracking are not exposed by the current API.
                </p>
              </div>
            </DashboardCard>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsAIEmployeesPage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useAIEmployeesAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const fullyDenied = snapshot?.employeesAccessDenied;
  const errorMessage =
    isError && !fullyDenied
      ? getApiErrorMessage(error, "Could not load AI employee analytics.")
      : null;

  const metrics = snapshot?.metrics;
  const secondaryMetrics = formatAIEmployeeSecondaryMetrics(metrics);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · AI Employees"
        title={
          <>
            AI employees{" "}
            <span className={dashboardAccents.emerald.text}>analytics</span>
          </>
        }
        description="Agent roster health, knowledge and tool coverage, and chat session volume from employee records."
        stats={buildAIEmployeesHeroStats(metrics)}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {fullyDenied ? (
          <AnalyticsAccessDenied
            title="AI employee analytics unavailable"
            message="You need AI employees read permission to view these metrics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Roster"
                title="Key metrics"
                description="Agent counts, knowledge coverage, tool adoption, and conversation volume."
              />
              <AnalyticsKpiGrid
                items={buildAIEmployeesKpis(metrics)}
                icons={[Bot, Users, BookOpen, Layers]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {secondaryMetrics.map((item) => (
                  <DashboardCard
                    key={item.label}
                    variant="default"
                    accent="emerald"
                    interactive={false}
                    className="p-4"
                  >
                    <p className="text-[12px] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                      {item.value}
                    </p>
                  </DashboardCard>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <AnalyticsDistributionChart
                title="Agents by status"
                subtitle="Active vs inactive roster"
                segments={buildAIEmployeesStatusChart(metrics)}
                accent="emerald"
                isLoading={isLoading}
              />
              <AnalyticsBarChart
                title="Agents by role"
                subtitle="Role distribution across the roster"
                segments={buildAIEmployeesRoleChart(metrics)}
                accent="emerald"
                isLoading={isLoading}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {snapshot?.detailsAccessDenied || snapshot?.conversationsAccessDenied ? (
                <div className="lg:col-span-2">
                  <AnalyticsRestrictedPanel
                    title="Capability metrics restricted"
                    message="You need AI employees read permission to view knowledge, tool, and conversation breakdowns."
                  />
                </div>
              ) : (
                <>
                  <AnalyticsDistributionChart
                    title="Capability coverage"
                    subtitle="Knowledge, tools, and chat adoption"
                    segments={buildAIEmployeesCapabilityChart(metrics)}
                    accent="purple"
                    isLoading={isLoading}
                  />
                  <AnalyticsInsightsPanel
                    title="Roster insights"
                    subtitle="Highlights from agent utilization metrics"
                    insights={buildAIEmployeesInsights(metrics)}
                    accent="emerald"
                    isLoading={isLoading}
                  />
                </>
              )}
            </section>

            <section>
              {snapshot?.detailsAccessDenied || snapshot?.conversationsAccessDenied ? (
                <AnalyticsRestrictedPanel
                  title="Roster table restricted"
                  message="You need AI employees read permission to view per-agent capability metrics."
                />
              ) : (
                <AnalyticsEmployeeRosterTable
                  rows={metrics?.employeeRows ?? []}
                  isLoading={isLoading}
                />
              )}
            </section>

            <DashboardCard
              variant="panel"
              accent="neutral"
              interactive={false}
              className="flex items-start gap-3 p-5"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
              <div>
                <p className="text-[14px] font-medium text-foreground">
                  Chat message volume not tracked
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Conversation list endpoints expose session metadata only, not
                  message counts or token usage. Agent task execution
                  participation is not linked in employee list APIs.
                </p>
              </div>
            </DashboardCard>
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsReportsPage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useReportsAnalytics();

  if (isLoading && !snapshot) {
    return <AnalyticsPageSkeleton />;
  }

  const fullyDenied =
    snapshot?.reportsAccessDenied && snapshot?.researchAnalyticsAccessDenied;
  const errorMessage =
    isError && !fullyDenied
      ? getApiErrorMessage(error, "Could not load reports analytics.")
      : null;

  const metrics = snapshot?.metrics;

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Reports"
        title={
          <>
            Reports{" "}
            <span className={dashboardAccents.gold.text}>dashboard</span>
          </>
        }
        description="Research report outcomes and generation activity. Research Hub is the only module with exportable report outputs today."
        stats={buildReportsHeroStats(metrics)}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {fullyDenied ? (
          <AnalyticsAccessDenied
            title="Reports analytics unavailable"
            message="You need research project read permission to view report metrics."
          />
        ) : (
          <>
            <section>
              <DashboardSectionHeader
                eyebrow="Outputs"
                title="Report KPIs"
                description="Aggregate report counts, completion rates, and recent generation volume."
              />
              <AnalyticsKpiGrid
                items={buildReportsKpis(metrics)}
                icons={[FileText, CheckCircle2, ClipboardList, Search]}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onRetry={() => void refetch()}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {snapshot?.reportsAccessDenied ? (
                <div className="lg:col-span-2">
                  <AnalyticsRestrictedPanel
                    title="Report breakdown restricted"
                    message="You need research project read permission to view report status charts."
                  />
                </div>
              ) : (
                <>
                  <AnalyticsDistributionChart
                    title="Reports by status"
                    subtitle="Pipeline and completion outcomes"
                    segments={buildReportsStatusChart(metrics)}
                    accent="gold"
                    isLoading={isLoading}
                  />
                  <AnalyticsBarChart
                    title="Report activity"
                    subtitle="Recent generation volume and outcomes"
                    segments={buildReportsActivityChart(metrics)}
                    accent="blue"
                    isLoading={isLoading}
                  />
                </>
              )}
            </section>

            <section className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                {snapshot?.reportsAccessDenied ? (
                  <AnalyticsRestrictedPanel
                    title="Recent reports restricted"
                    message="You need research project read permission to view the reports table."
                  />
                ) : (
                  <AnalyticsReportsTable
                    reports={metrics?.recentReports ?? []}
                    isLoading={isLoading}
                  />
                )}
              </div>
              <div className="lg:col-span-2">
                <AnalyticsInsightsPanel
                  title="Report insights"
                  subtitle="Highlights from research report metrics"
                  insights={buildReportsInsights(metrics)}
                  accent="gold"
                  isLoading={isLoading}
                />
              </div>
            </section>

            <DashboardCard
              variant="panel"
              accent="neutral"
              interactive={false}
              className="flex items-start gap-3 p-5"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
              <div>
                <p className="text-[14px] font-medium text-foreground">
                  Research reports only
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  No generic reports API exists. Scheduled exports, custom
                  analytics PDFs, and workflow output reports are not available.
                  Metrics combine research analytics aggregates with up to 100
                  recent report records.
                </p>
              </div>
            </DashboardCard>

            {snapshot &&
              (snapshot.reportsAccessDenied ||
                snapshot.projectsAccessDenied ||
                snapshot.researchAnalyticsAccessDenied) && (
                <DashboardCard
                  variant="panel"
                  accent="gold"
                  interactive={false}
                  className="flex items-start gap-3 p-5"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Some report metrics are hidden because of missing read
                    permissions. Available aggregates still reflect
                    organization-wide totals where accessible.
                  </p>
                </DashboardCard>
              )}
          </>
        )}
      </div>
    </AnalyticsLayout>
  );
}

export function AnalyticsComingSoonPage({
  sectionId,
}: {
  sectionId:
    | "organization"
    | "knowledge"
    | "ai-employees"
    | "agent-teams"
    | "workflows"
    | "reports";
}) {
  const section = getAnalyticsSectionById(sectionId);
  const accentKey = analyticsNavAccents[sectionId];
  const accent = dashboardAccents[accentKey];
  const Icon = analyticsNavIcons[sectionId];

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow={`Analytics · ${section?.title ?? "Section"}`}
        title={
          <>
            {section?.title ?? "Analytics"}{" "}
            <span className={accent.text}>insights</span>
          </>
        }
        description={
          section?.description ??
          "Detailed analytics for this module will arrive in a future phase."
        }
      />
      <AnalyticsSubNav />

      <div className="mt-10 px-6 md:mt-12 md:px-8">
        <DashboardCard
          variant="panel"
          accent={accentKey}
          interactive={false}
          className="flex flex-col items-center px-6 py-14 text-center"
        >
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl border",
              accent.bgSubtle,
              accent.border,
            )}
          >
            <Icon className={cn("size-6", accent.text)} />
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.04em] text-tertiary">
            <Clock className="size-3" />
            Coming soon
          </span>
          <h3 className="mt-4 text-[16px] font-medium text-foreground">
            {section?.title} analytics
          </h3>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
            Phase 1 ships executive, research, and browser automation dashboards.{" "}
            {section?.title} metrics will connect to dedicated analytics APIs in a later release.
          </p>
        </DashboardCard>
      </div>
    </AnalyticsLayout>
  );
}

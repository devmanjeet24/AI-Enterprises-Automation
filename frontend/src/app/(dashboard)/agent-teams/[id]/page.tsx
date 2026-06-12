import type { Metadata } from "next";

import { AgentTeamDetailPage } from "@/components/agent-teams";
import { siteConfig } from "@/config/site";

interface AgentTeamDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Agent Team · ${siteConfig.name}`,
    description: "Agent team detail and execution.",
  };
}

export default async function AgentTeamDetailRoute({
  params,
}: AgentTeamDetailRouteProps) {
  const { id } = await params;
  return <AgentTeamDetailPage teamId={id} />;
}

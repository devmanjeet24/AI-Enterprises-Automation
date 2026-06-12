import type { Metadata } from "next";

import { AgentTeamsPage } from "@/components/agent-teams";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Agent Teams · ${siteConfig.name}`,
  description:
    "Orchestrate multi-agent teams, assign AI employees, and run sequential tasks.",
};

export default function AgentTeamsRoute() {
  return <AgentTeamsPage />;
}

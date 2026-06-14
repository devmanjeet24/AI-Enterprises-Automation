import type { Metadata } from "next";

import { AnalyticsAgentTeamsPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Agent Teams Analytics · ${siteConfig.name}`,
  description: "Multi-agent task execution and team performance analytics.",
};

export default function AnalyticsAgentTeamsRoute() {
  return <AnalyticsAgentTeamsPage />;
}

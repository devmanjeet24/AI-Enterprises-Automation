import type { Metadata } from "next";

import { AnalyticsWorkflowsPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Workflow Analytics · ${siteConfig.name}`,
  description: "Workflow execution throughput and success rate analytics.",
};

export default function AnalyticsWorkflowsRoute() {
  return <AnalyticsWorkflowsPage />;
}

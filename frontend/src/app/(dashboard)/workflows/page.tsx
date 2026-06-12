import type { Metadata } from "next";

import { WorkflowsPage } from "@/components/workflows";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Workflows · ${siteConfig.name}`,
  description:
    "Build reusable automation pipelines, define ordered steps, and run workflows on demand.",
};

export default function WorkflowsRoute() {
  return <WorkflowsPage />;
}

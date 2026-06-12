import type { Metadata } from "next";

import { WorkflowDetailPage } from "@/components/workflows";
import { siteConfig } from "@/config/site";

interface WorkflowDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Workflow · ${siteConfig.name}`,
    description: "Workflow detail, builder, execution, and run history.",
  };
}

export default async function WorkflowDetailRoute({
  params,
}: WorkflowDetailRouteProps) {
  const { id } = await params;
  return <WorkflowDetailPage workflowId={id} />;
}

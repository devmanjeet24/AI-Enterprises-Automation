import type { Metadata } from "next";

import { ResearchProjectDetailPage } from "@/components/research-hub/research-project-detail-page";
import { siteConfig } from "@/config/site";

interface ResearchProjectDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Research Project · ${siteConfig.name}`,
    description: "Research project detail, run flow, reports, and execution history.",
  };
}

export default async function ResearchProjectDetailRoute({
  params,
}: ResearchProjectDetailRouteProps) {
  const { id } = await params;
  return <ResearchProjectDetailPage projectId={id} />;
}

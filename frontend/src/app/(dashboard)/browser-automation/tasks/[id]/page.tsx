import type { Metadata } from "next";

import { BrowserTaskDetailPage } from "@/components/browser-automation/browser-task-detail-page";
import { siteConfig } from "@/config/site";

interface BrowserTaskDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Browser Task · ${siteConfig.name}`,
    description: "Browser task detail, run flow, configuration, and execution history.",
  };
}

export default async function BrowserTaskDetailRoute({
  params,
}: BrowserTaskDetailRouteProps) {
  const { id } = await params;
  return <BrowserTaskDetailPage taskId={id} />;
}

import type { Metadata } from "next";

import { KnowledgeBaseDetailPage } from "@/components/knowledge-base";
import { siteConfig } from "@/config/site";

interface KnowledgeBaseDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Document · Knowledge Base · ${siteConfig.name}`,
    description: "View and manage a knowledge document.",
  };
}

export default async function KnowledgeBaseDetailRoute({
  params,
}: KnowledgeBaseDetailRouteProps) {
  const { id } = await params;
  return <KnowledgeBaseDetailPage documentId={id} />;
}

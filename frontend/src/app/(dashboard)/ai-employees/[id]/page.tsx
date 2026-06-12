import type { Metadata } from "next";

import { AiEmployeeDetailPage } from "@/components/ai-employees";
import { siteConfig } from "@/config/site";

interface AiEmployeeDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `AI Employee · ${siteConfig.name}`,
    description: "Configure and chat with an AI employee.",
  };
}

export default async function AiEmployeeDetailRoute({
  params,
}: AiEmployeeDetailRouteProps) {
  const { id } = await params;
  return <AiEmployeeDetailPage employeeId={id} />;
}

import type { Metadata } from "next";

import { TeamDetailPage } from "@/components/settings/teams";
import { siteConfig } from "@/config/site";

interface TeamDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Team · Settings · ${siteConfig.name}`,
    description: "Org team profile, department assignment, and status.",
  };
}

export default async function TeamDetailRoute({ params }: TeamDetailRouteProps) {
  const { id } = await params;
  return <TeamDetailPage teamId={id} />;
}

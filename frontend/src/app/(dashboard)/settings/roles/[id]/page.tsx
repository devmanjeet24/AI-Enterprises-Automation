import type { Metadata } from "next";

import { RoleDetailPage } from "@/components/settings/roles";
import { siteConfig } from "@/config/site";

interface RoleDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Role · Settings · ${siteConfig.name}`,
    description: "Role profile, status, and permission grants.",
  };
}

export default async function RoleDetailRoute({ params }: RoleDetailRouteProps) {
  const { id } = await params;
  return <RoleDetailPage roleId={id} />;
}

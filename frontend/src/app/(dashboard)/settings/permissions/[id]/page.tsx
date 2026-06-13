import type { Metadata } from "next";

import { PermissionDetailPage } from "@/components/settings/permissions";
import { siteConfig } from "@/config/site";

interface PermissionDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Permission · Settings · ${siteConfig.name}`,
    description: "Permission definition and linked role grants.",
  };
}

export default async function PermissionDetailRoute({ params }: PermissionDetailRouteProps) {
  const { id } = await params;
  return <PermissionDetailPage permissionId={id} />;
}

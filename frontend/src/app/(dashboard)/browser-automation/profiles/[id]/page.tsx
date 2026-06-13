import type { Metadata } from "next";

import { BrowserProfileDetailPage } from "@/components/browser-automation/browser-profile-detail-page";
import { siteConfig } from "@/config/site";

interface BrowserProfileDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Browser Profile · ${siteConfig.name}`,
    description: "Browser profile configuration, linked tasks, and lifecycle actions.",
  };
}

export default async function BrowserProfileDetailRoute({
  params,
}: BrowserProfileDetailRouteProps) {
  const { id } = await params;
  return <BrowserProfileDetailPage profileId={id} />;
}

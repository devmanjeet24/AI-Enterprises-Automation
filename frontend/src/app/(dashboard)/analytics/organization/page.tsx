import type { Metadata } from "next";

import { AnalyticsOrganizationPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Organization Analytics · ${siteConfig.name}`,
  description: "Organization structure and workspace analytics.",
};

export default function AnalyticsOrganizationRoute() {
  return <AnalyticsOrganizationPage />;
}

import type { Metadata } from "next";

import { OrganizationPage } from "@/components/settings/organization-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Organization · Settings · ${siteConfig.name}`,
  description: "View and update your organization profile and workspace metadata.",
};

export default function OrganizationSettingsRoute() {
  return <OrganizationPage />;
}

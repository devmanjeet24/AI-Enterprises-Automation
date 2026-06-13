import type { Metadata } from "next";

import { PermissionsPage } from "@/components/settings/permissions";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Permissions · Settings · ${siteConfig.name}`,
  description: "View and manage the organization permission catalog.",
};

export default function PermissionsSettingsRoute() {
  return <PermissionsPage />;
}

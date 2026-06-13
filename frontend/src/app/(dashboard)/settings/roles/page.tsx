import type { Metadata } from "next";

import { RolesPage } from "@/components/settings/roles";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Roles · Settings · ${siteConfig.name}`,
  description: "View and manage organization roles and permission bundles.",
};

export default function RolesSettingsRoute() {
  return <RolesPage />;
}

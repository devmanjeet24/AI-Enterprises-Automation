import type { Metadata } from "next";

import { TeamsPage } from "@/components/settings/teams";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Org Teams · Settings · ${siteConfig.name}`,
  description: "View and manage organizational teams nested under departments.",
};

export default function TeamsSettingsRoute() {
  return <TeamsPage />;
}

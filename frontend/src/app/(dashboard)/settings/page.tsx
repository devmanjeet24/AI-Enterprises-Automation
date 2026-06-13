import type { Metadata } from "next";

import { SettingsPage } from "@/components/settings";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Settings · ${siteConfig.name}`,
  description:
    "Manage organization profile, users, structure, roles, and access control.",
};

export default function SettingsRoute() {
  return <SettingsPage />;
}

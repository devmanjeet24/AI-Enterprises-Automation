import type { Metadata } from "next";

import { UsersPage } from "@/components/settings/users";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Users · Settings · ${siteConfig.name}`,
  description: "View and manage organization user accounts, profiles, and role assignments.",
};

export default function UsersSettingsRoute() {
  return <UsersPage />;
}

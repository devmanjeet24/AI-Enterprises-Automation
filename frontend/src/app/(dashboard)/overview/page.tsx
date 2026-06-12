import type { Metadata } from "next";

import { OverviewPage } from "@/components/dashboard";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Overview · ${siteConfig.name}`,
  description: "Monitor your AI employees, workflows, and platform activity.",
};

export default function OverviewRoute() {
  return <OverviewPage />;
}

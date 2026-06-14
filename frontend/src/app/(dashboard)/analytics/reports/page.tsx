import type { Metadata } from "next";

import { AnalyticsReportsPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Reports · ${siteConfig.name}`,
  description: "Research report outcomes and generation activity.",
};

export default function AnalyticsReportsRoute() {
  return <AnalyticsReportsPage />;
}

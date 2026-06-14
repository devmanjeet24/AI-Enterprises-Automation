import type { Metadata } from "next";

import { AnalyticsResearchPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Research Analytics · ${siteConfig.name}`,
  description: "Research project portfolio, report outcomes, and run activity metrics.",
};

export default function AnalyticsResearchRoute() {
  return <AnalyticsResearchPage />;
}

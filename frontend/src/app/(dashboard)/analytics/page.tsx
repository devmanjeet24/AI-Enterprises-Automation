import type { Metadata } from "next";

import { AnalyticsExecutivePage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Analytics · ${siteConfig.name}`,
  description: "Organization-wide KPIs, research analytics, and browser automation metrics.",
};

export default function AnalyticsRoute() {
  return <AnalyticsExecutivePage />;
}

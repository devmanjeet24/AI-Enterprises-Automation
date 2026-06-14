import type { Metadata } from "next";

import { AnalyticsAIEmployeesPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `AI Employees Analytics · ${siteConfig.name}`,
  description: "AI employee utilization and chat activity analytics.",
};

export default function AnalyticsAiEmployeesRoute() {
  return <AnalyticsAIEmployeesPage />;
}

import type { Metadata } from "next";

import { AnalyticsBrowserAutomationPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Browser Automation Analytics · ${siteConfig.name}`,
  description: "Browser profiles, automation tasks, and execution performance metrics.",
};

export default function AnalyticsBrowserAutomationRoute() {
  return <AnalyticsBrowserAutomationPage />;
}

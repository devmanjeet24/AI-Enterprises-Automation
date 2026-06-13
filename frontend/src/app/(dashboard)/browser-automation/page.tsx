import type { Metadata } from "next";

import { BrowserAutomationPage } from "@/components/browser-automation";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Browser Automation · ${siteConfig.name}`,
  description:
    "Configure browser profiles, define web automation tasks, and track execution history.",
};

export default function BrowserAutomationRoute() {
  return <BrowserAutomationPage />;
}

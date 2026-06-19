import type { Metadata } from "next";

import { AnalyticsOmnichannelPage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Omnichannel Analytics · ${siteConfig.name}`,
  description:
    "Conversation volume, channel mix, message roles, AI vs human handling, and handoff metrics.",
};

export default function AnalyticsOmnichannelRoute() {
  return <AnalyticsOmnichannelPage />;
}

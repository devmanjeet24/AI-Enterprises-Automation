import type { Metadata } from "next";

import { AnalyticsKnowledgePage } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Knowledge Analytics · ${siteConfig.name}`,
  description: "Knowledge base document and query analytics.",
};

export default function AnalyticsKnowledgeRoute() {
  return <AnalyticsKnowledgePage />;
}

import type { Metadata } from "next";

import { ResearchHubPage } from "@/components/research-hub";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Research Hub · ${siteConfig.name}`,
  description:
    "Run structured AI research projects with methodology templates, agent teams, and versioned reports.",
};

export default function ResearchHubRoute() {
  return <ResearchHubPage />;
}

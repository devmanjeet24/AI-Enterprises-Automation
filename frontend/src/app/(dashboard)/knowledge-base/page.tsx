import type { Metadata } from "next";

import { KnowledgeBasePage } from "@/components/knowledge-base";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Knowledge Base · ${siteConfig.name}`,
  description:
    "Upload, process, and search your organization's knowledge documents.",
};

export default function KnowledgeBaseRoute() {
  return <KnowledgeBasePage />;
}

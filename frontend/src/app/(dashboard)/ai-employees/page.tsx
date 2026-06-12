import type { Metadata } from "next";

import { AiEmployeesPage } from "@/components/ai-employees";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `AI Employees · ${siteConfig.name}`,
  description:
    "Create, configure, and chat with knowledge-grounded AI employees.",
};

export default function AiEmployeesRoute() {
  return <AiEmployeesPage />;
}

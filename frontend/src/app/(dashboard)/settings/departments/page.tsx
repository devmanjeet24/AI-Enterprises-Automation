import type { Metadata } from "next";

import { DepartmentsPage } from "@/components/settings/departments";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Departments · Settings · ${siteConfig.name}`,
  description: "View and manage organizational departments and structure.",
};

export default function DepartmentsSettingsRoute() {
  return <DepartmentsPage />;
}

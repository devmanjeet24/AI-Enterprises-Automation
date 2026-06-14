import type { Metadata } from "next";

import { CustomerSupportPage } from "@/components/customer-support";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Customer Support · ${siteConfig.name}`,
  description:
    "Manage support tickets, assign agents and AI employees, and track customer conversations.",
};

export default function CustomerSupportRoute() {
  return <CustomerSupportPage />;
}

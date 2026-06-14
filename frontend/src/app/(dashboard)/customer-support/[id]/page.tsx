import type { Metadata } from "next";

import { CustomerSupportDetailPage } from "@/components/customer-support/customer-support-detail-page";
import { siteConfig } from "@/config/site";

interface CustomerSupportDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Support Ticket · ${siteConfig.name}`,
    description: "Support ticket detail, conversation thread, and assignment management.",
  };
}

export default async function CustomerSupportDetailRoute({
  params,
}: CustomerSupportDetailRouteProps) {
  const { id } = await params;
  return <CustomerSupportDetailPage ticketId={id} />;
}

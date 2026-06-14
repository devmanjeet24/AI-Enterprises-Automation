import type { Metadata } from "next";

import { OmnichannelConversationDetailPage } from "@/components/omnichannel";

export const metadata: Metadata = { title: "Omnichannel Conversation" };

export default async function OmnichannelConversationRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OmnichannelConversationDetailPage conversationId={id} />;
}

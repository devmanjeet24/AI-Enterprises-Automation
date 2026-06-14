import type { Metadata } from "next";

import { OmnichannelChannelDetailPage } from "@/components/omnichannel";

export const metadata: Metadata = { title: "Omnichannel Channel" };

export default async function OmnichannelChannelRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OmnichannelChannelDetailPage channelId={id} />;
}

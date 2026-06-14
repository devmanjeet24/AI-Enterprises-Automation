import type { Metadata } from "next";

import { VoiceAiDetailPage } from "@/components/voice-ai";

export const metadata: Metadata = {
  title: "Voice Agent",
};

export default async function VoiceAiDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VoiceAiDetailPage agentId={id} />;
}

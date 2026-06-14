import type { Metadata } from "next";

import { VoiceAiSessionDetailPage } from "@/components/voice-ai";

export const metadata: Metadata = {
  title: "Voice Session",
};

export default async function VoiceAiSessionDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VoiceAiSessionDetailPage sessionId={id} />;
}

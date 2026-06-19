import type { Metadata } from "next";

import { VoiceAiPage } from "@/components/voice-ai";

export const metadata: Metadata = {
  title: "Voice Assistant",
};

export default function VoiceAiRoute() {
  return <VoiceAiPage />;
}

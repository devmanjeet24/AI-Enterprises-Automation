import type { Metadata } from "next";

import { OmnichannelPage } from "@/components/omnichannel";

export const metadata: Metadata = { title: "Omnichannel Communication" };

export default function OmnichannelRoute() {
  return <OmnichannelPage />;
}

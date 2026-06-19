"use client";

import opportunityImage from "@/assets/Images/opportunity.jpg";

import {
  LandingCircularVisual,
  type FloatingCardConfig,
} from "./landing-circular-visual";

const researchCards: FloatingCardConfig[] = [
  {
    id: "progress",
    message: "Research in progress",
    variant: "pill",
    className:
      "left-0 top-[8%] z-30 sm:left-[-2%] md:left-[-4%] md:top-[10%]",
    delay: 0.35,
    floatDuration: 5.5,
  },
  {
    id: "sources",
    message: "847",
    label: "Sources analyzed",
    variant: "metric",
    className:
      "right-[-2%] top-[14%] z-30 sm:right-[-2%] md:right-[-4%] md:top-[16%]",
    delay: 0.5,
    floatDuration: 6.5,
  },
  {
    id: "report",
    message:
      "Report generated — 142 findings collected from market sizing, feature comparison, and pricing analysis.",
    variant: "glass",
    className:
      "bottom-[6%] left-[-2%] z-30 max-w-[14rem] sm:max-w-[16rem] md:bottom-[8%] md:left-[-6%] md:max-w-[18rem]",
    delay: 0.65,
    floatDuration: 7,
  },
];

export function BusinessResearchHubVisual() {
  return (
    <LandingCircularVisual
      image={opportunityImage}
      cards={researchCards}
      showSparkles
    />
  );
}

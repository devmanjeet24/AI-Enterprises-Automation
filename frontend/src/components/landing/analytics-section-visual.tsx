"use client";

import crmImage from "@/assets/Images/CRMImage.jpg";

import {
  LandingCircularVisual,
  type FloatingCardConfig,
} from "./landing-circular-visual";

const analyticsCards: FloatingCardConfig[] = [
  {
    id: "success",
    message: "98.2%",
    label: "Success rate",
    variant: "metric",
    className:
      "left-0 top-[6%] z-30 sm:left-[-2%] md:left-[-4%] md:top-[8%]",
    delay: 0.35,
    floatDuration: 5.5,
  },
  {
    id: "tasks",
    message: "12.4k tasks completed across all agents this month.",
    variant: "glass",
    className:
      "bottom-[8%] left-[-2%] z-30 max-w-[14rem] sm:max-w-[16rem] md:bottom-[10%] md:left-[-6%] md:max-w-[18rem]",
    delay: 0.5,
    floatDuration: 6.5,
  },
  {
    id: "response",
    message: "1.2s avg response time",
    variant: "pill",
    className:
      "right-[-2%] top-[16%] z-30 max-w-[11rem] sm:max-w-[12rem] md:right-[-4%] md:top-[20%]",
    delay: 0.65,
    floatDuration: 7,
  },
];

export function AnalyticsSectionVisual() {
  return (
    <LandingCircularVisual image={crmImage} cards={analyticsCards} showSparkles />
  );
}

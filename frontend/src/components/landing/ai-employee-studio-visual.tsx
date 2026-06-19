"use client";

import happyGirlImage from "@/assets/Images/happygirl.jpeg";

import {
  LandingCircularVisual,
  type FloatingCardConfig,
} from "./landing-circular-visual";

const chatCards: FloatingCardConfig[] = [
  {
    id: "user",
    message: "Yes, let's talk on Friday!",
    variant: "accent",
    className:
      "left-0 top-[8%] z-30 max-w-[11rem] sm:max-w-[12.5rem] md:left-[-4%] md:top-[10%] md:max-w-[13rem]",
    delay: 0.35,
    floatDuration: 5.5,
  },
  {
    id: "assistant",
    message:
      "Ok! Angela, our SVP of Franchise Development, will call you on Friday at 3:30 PM.",
    variant: "glass",
    className:
      "bottom-[6%] left-[-2%] z-30 max-w-[14rem] sm:max-w-[16rem] md:bottom-[8%] md:left-[-6%] md:max-w-[18rem]",
    delay: 0.5,
    floatDuration: 6.5,
  },
  {
    id: "meta",
    message: "Grounded reply · Confidence 94%",
    variant: "pill",
    className:
      "right-[-2%] top-[14%] z-30 max-w-[10rem] sm:max-w-[11rem] md:right-[-4%] md:top-[18%]",
    delay: 0.65,
    floatDuration: 7,
  },
];

export function AiEmployeeStudioVisual() {
  return (
    <LandingCircularVisual image={happyGirlImage} cards={chatCards} showSparkles />
  );
}

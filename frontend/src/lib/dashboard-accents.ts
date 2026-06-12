export type DashboardAccent = "gold" | "blue" | "purple" | "emerald" | "neutral";

export const dashboardAccents: Record<
  DashboardAccent,
  {
    text: string;
    textMuted: string;
    bg: string;
    bgSubtle: string;
    border: string;
    borderHover: string;
    glow: string;
    bar: string;
    dot: string;
  }
> = {
  gold: {
    text: "text-[#f5c518]",
    textMuted: "text-[#f5c518]/70",
    bg: "bg-[#f5c518]/12",
    bgSubtle: "bg-[#f5c518]/[0.06]",
    border: "border-[#f5c518]/20",
    borderHover: "hover:border-[#f5c518]/30",
    glow: "from-[#f5c518]/[0.07]",
    bar: "bg-[#f5c518]",
    dot: "bg-[#f5c518]",
  },
  blue: {
    text: "text-[#6B9BF8]",
    textMuted: "text-[#6B9BF8]/70",
    bg: "bg-[#6B9BF8]/12",
    bgSubtle: "bg-[#6B9BF8]/[0.06]",
    border: "border-[#6B9BF8]/20",
    borderHover: "hover:border-[#6B9BF8]/30",
    glow: "from-[#6B9BF8]/[0.07]",
    bar: "bg-[#6B9BF8]",
    dot: "bg-[#6B9BF8]",
  },
  purple: {
    text: "text-[#A78BFA]",
    textMuted: "text-[#A78BFA]/70",
    bg: "bg-[#A78BFA]/12",
    bgSubtle: "bg-[#A78BFA]/[0.06]",
    border: "border-[#A78BFA]/20",
    borderHover: "hover:border-[#A78BFA]/30",
    glow: "from-[#A78BFA]/[0.07]",
    bar: "bg-[#A78BFA]",
    dot: "bg-[#A78BFA]",
  },
  emerald: {
    text: "text-[#4ADE80]",
    textMuted: "text-[#4ADE80]/70",
    bg: "bg-[#4ADE80]/12",
    bgSubtle: "bg-[#4ADE80]/[0.06]",
    border: "border-[#4ADE80]/20",
    borderHover: "hover:border-[#4ADE80]/30",
    glow: "from-[#4ADE80]/[0.07]",
    bar: "bg-[#4ADE80]",
    dot: "bg-[#4ADE80]",
  },
  neutral: {
    text: "text-foreground",
    textMuted: "text-muted-foreground",
    bg: "bg-white/[0.06]",
    bgSubtle: "bg-white/[0.03]",
    border: "border-white/[0.08]",
    borderHover: "hover:border-white/[0.12]",
    glow: "from-white/[0.04]",
    bar: "bg-white/30",
    dot: "bg-tertiary",
  },
};

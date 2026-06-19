"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Bot,
  Clock,
  FileText,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import blueLinesImage from "@/assets/Images/light-to-blue-lines.svg";
import { defaultTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MetricCard = {
  id: string;
  value: string;
  label: string;
  icon: LucideIcon;
  className: string;
  delay: number;
  floatDuration: number;
};

const metrics: MetricCard[] = [
  {
    id: "success",
    value: "98.2%",
    label: "Success Rate",
    icon: Activity,
    className:
      "left-[4%] top-[14%] md:left-[6%] md:top-[16%] lg:left-[5%] lg:top-[18%]",
    delay: 0.25,
    floatDuration: 5.5,
  },
  {
    id: "tasks",
    value: "10M+",
    label: "Tasks Automated",
    icon: Zap,
    className:
      "right-[4%] top-[12%] md:right-[6%] md:top-[14%] lg:right-[5%] lg:top-[16%]",
    delay: 0.35,
    floatDuration: 6,
  },
  {
    id: "availability",
    value: "24/7",
    label: "AI Availability",
    icon: Clock,
    className:
      "left-[2%] bottom-[22%] md:left-[4%] md:bottom-[24%] lg:left-[3%] lg:bottom-[26%]",
    delay: 0.45,
    floatDuration: 6.5,
  },
  {
    id: "employees",
    value: "Active",
    label: "AI Employees",
    icon: Bot,
    className:
      "right-[2%] bottom-[28%] md:right-[4%] md:bottom-[30%] lg:right-[3%] lg:bottom-[32%]",
    delay: 0.55,
    floatDuration: 5.8,
  },
  {
    id: "reports",
    value: "2.8k+",
    label: "Research Reports",
    icon: FileText,
    className:
      "bottom-[8%] left-1/2 z-20 -translate-x-1/2 md:bottom-[10%] lg:bottom-[12%]",
    delay: 0.65,
    floatDuration: 7,
  },
];

const workflowSteps = ["Plan", "Gather", "Synthesize", "Deploy"] as const;

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 17) % 84)}%`,
  top: `${6 + ((index * 23) % 88)}%`,
  size: index % 3 === 0 ? 3 : 2,
  delay: index * 0.15,
  duration: 4 + (index % 4),
}));

export function AuthShowcasePanel() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden px-6 py-10 sm:min-h-[460px] sm:px-8 lg:min-h-full lg:py-12"
      aria-hidden
    >
      <BackgroundEffects prefersReducedMotion={!!prefersReducedMotion} />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...defaultTransition, delay: 0.1 }}
        className="relative z-20 mb-6 text-center lg:mb-8"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand/90">
          Enterprise AI Platform
        </p>
        <h2 className="mt-2 font-display text-xl leading-tight tracking-[-0.02em] text-foreground sm:text-2xl">
          Your AI Workforce.
          <br />
          <span className="text-brand">One Platform.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-[16rem] text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
          Automate operations with AI employees, grounded knowledge, and
          enterprise controls.
        </p>
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-[340px] flex-1 sm:max-w-[380px]">
        <div className="relative aspect-square w-full">
          <CentralHub prefersReducedMotion={!!prefersReducedMotion} />

          <div className="hidden lg:block">
            {metrics.map((metric) => (
              <FloatingMetricCard
                key={metric.id}
                metric={metric}
                prefersReducedMotion={!!prefersReducedMotion}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:hidden">
          {metrics.map((metric, index) => (
            <MetricCardContent
              key={metric.id}
              metric={metric}
              compact={index === metrics.length - 1}
              className={cn(index === metrics.length - 1 && "col-span-2 mx-auto max-w-[11rem]")}
            />
          ))}
        </div>
      </div>

      <WorkflowIndicator prefersReducedMotion={!!prefersReducedMotion} />
    </div>
  );
}

function BackgroundEffects({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 40%, rgba(39,127,255,0.14) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 top-1/4 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(39,127,255,0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-12 bottom-1/4 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,67,0.2) 0%, transparent 70%)",
        }}
      />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="pointer-events-none absolute rounded-full bg-sky-400/40"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={
            prefersReducedMotion
              ? { opacity: 0.35 }
              : { opacity: [0.2, 0.7, 0.2], scale: [1, 1.4, 1] }
          }
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </>
  );
}

function CentralHub({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...defaultTransition, delay: 0.2, duration: 0.9 }}
        className="pointer-events-none absolute -right-[8%] top-1/2 z-0 w-[42%] -translate-y-1/2 opacity-80"
      >
        <Image
          src={blueLinesImage}
          alt=""
          className="h-auto w-full object-contain drop-shadow-[0_16px_32px_rgba(39,127,255,0.2)]"
        />
      </motion.div>

      <div className="absolute inset-[8%] flex items-center justify-center">
        {[100, 140, 180].map((size, index) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-white/[0.08]"
            style={{ width: size, height: size }}
            animate={prefersReducedMotion ? undefined : { rotate: index % 2 === 0 ? 360 : -360 }}
            transition={{
              duration: 28 + index * 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <span
              className="absolute size-1.5 rounded-full bg-brand/80"
              style={{ top: -3, left: "50%" }}
            />
          </motion.div>
        ))}

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...defaultTransition, delay: 0.3 }}
          className="relative z-10 flex size-24 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] shadow-[0_0_48px_rgba(39,127,255,0.25),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-xl sm:size-28"
        >
          <div
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(39,127,255,0.28) 0%, transparent 70%)",
            }}
          />
          <Sparkles className="relative size-8 text-brand sm:size-9" />
        </motion.div>
      </div>
    </>
  );
}

function FloatingMetricCard({
  metric,
  prefersReducedMotion,
}: {
  metric: MetricCard;
  prefersReducedMotion: boolean;
}) {
  const Icon = metric.icon;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.96 }}
      animate={
        prefersReducedMotion
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: [0, -6, 0], scale: 1 }
      }
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
      transition={
        prefersReducedMotion
          ? { ...defaultTransition, delay: metric.delay }
          : {
              opacity: { ...defaultTransition, delay: metric.delay },
              scale: { ...defaultTransition, delay: metric.delay },
              y: {
                duration: metric.floatDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: metric.delay + 0.6,
              },
            }
      }
      className={cn("absolute z-20", metric.className)}
    >
      <MetricCardContent metric={metric} />
    </motion.div>
  );
}

function MetricCardContent({
  metric,
  compact = false,
  className,
}: {
  metric: MetricCard;
  compact?: boolean;
  className?: string;
}) {
  const Icon = metric.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-shadow duration-300 hover:border-white/25 hover:shadow-[0_12px_40px_rgba(39,127,255,0.18)]",
        compact ? "text-center" : "min-w-[7.5rem]",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2", compact && "justify-center")}>
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-brand/20 bg-brand/10">
          <Icon className="size-3 text-brand" />
        </div>
        <div className={compact ? "text-left" : undefined}>
          <p className="font-display text-sm leading-none text-brand sm:text-base">
            {metric.value}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
            {metric.label}
          </p>
        </div>
      </div>
    </div>
  );
}

function WorkflowIndicator({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...defaultTransition, delay: 0.5 }}
      className="relative z-20 mt-6 w-full max-w-[280px]"
    >
      <div className="flex items-center justify-between gap-1">
        {workflowSteps.map((step, index) => (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full items-center">
              {index > 0 ? (
                <div className="absolute right-1/2 left-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-sky-400/40" />
              ) : null}
              <motion.div
                className="relative z-10 mx-auto flex size-7 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10 text-[9px] font-medium text-sky-200 backdrop-blur-sm"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { boxShadow: ["0 0 0 rgba(39,127,255,0)", "0 0 12px rgba(39,127,255,0.35)", "0 0 0 rgba(39,127,255,0)"] }
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: index * 0.4,
                }}
              >
                {index + 1}
              </motion.div>
              {index < workflowSteps.length - 1 ? (
                <div className="absolute right-0 left-1/2 h-px bg-gradient-to-r from-sky-400/40 via-sky-400/40 to-transparent" />
              ) : null}
            </div>
            <span className="mt-1.5 text-[9px] text-muted-foreground">{step}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

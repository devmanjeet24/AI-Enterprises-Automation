"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type MockVariant =
  | "chat"
  | "knowledge"
  | "agents"
  | "workflow"
  | "research"
  | "browser"
  | "analytics";

interface MockUiPanelProps {
  variant: MockVariant;
  className?: string;
}

export function MockUiPanel({ variant, className }: MockUiPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.01 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "premium-card group relative aspect-[4/3] overflow-hidden p-5",
        className,
      )}
    >
      <div
        className="premium-card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.12), transparent 65%)",
        }}
      />
      <div className="relative flex h-full flex-col">
        <MockChrome />
        <div className="mt-4 flex-1">{renderVariant(variant)}</div>
      </div>
    </motion.div>
  );
}

function MockChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3">
      <div className="size-2 rounded-full bg-destructive/60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="size-2 rounded-full bg-warning/60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="size-2 rounded-full bg-success/60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="ml-3 h-2 max-w-32 flex-1 rounded-full bg-surface-hover transition-colors duration-300 group-hover:bg-surface-hover/80" />
    </div>
  );
}

function renderVariant(variant: MockVariant) {
  switch (variant) {
    case "chat":
      return <ChatMock />;
    case "knowledge":
      return <KnowledgeMock />;
    case "agents":
      return <AgentsMock />;
    case "workflow":
      return <WorkflowMock />;
    case "research":
      return <ResearchMock />;
    case "browser":
      return <BrowserMock />;
    case "analytics":
      return <AnalyticsMock />;
  }
}

function ChatMock() {
  return (
    <div className="space-y-3">
      <div className="ml-auto max-w-[75%] rounded-xl rounded-tr-sm border border-brand/15 bg-brand-muted px-3 py-2 text-xs text-foreground transition-colors duration-300 group-hover:border-brand/25">
        Summarize this support ticket and draft a reply.
      </div>
      <div className="max-w-[80%] rounded-xl rounded-tl-sm border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground transition-colors duration-300 group-hover:bg-surface/80">
        Customer reports billing discrepancy on invoice #4821. Policy: verify
        account tier before refund.
      </div>
      <div className="flex gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-tertiary transition-colors duration-300 group-hover:border-border-default">
          Source: KB-104
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-tertiary transition-colors duration-300 group-hover:border-border-default">
          Confidence: 94%
        </span>
      </div>
    </div>
  );
}

function KnowledgeMock() {
  return (
    <div className="space-y-2">
      {["Product FAQ.pdf", "Security Policy.docx", "Onboarding Guide.pdf"].map(
        (doc) => (
          <div
            key={doc}
            className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-3 py-2 transition-all duration-300 group-hover:border-border-default group-hover:bg-surface/60"
          >
            <span className="text-xs text-muted-foreground">{doc}</span>
            <span className="text-[10px] text-brand">Embedded</span>
          </div>
        ),
      )}
      <div className="mt-3 rounded-lg border border-border bg-surface/40 p-3 transition-colors duration-300 group-hover:bg-surface/60">
        <div className="h-1.5 w-full rounded-full bg-surface-hover">
          <div className="h-1.5 w-3/4 rounded-full bg-brand transition-all duration-500 group-hover:w-[82%]" />
        </div>
        <p className="mt-2 text-[10px] text-tertiary">Indexing 847 chunks…</p>
      </div>
    </div>
  );
}

function AgentsMock() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {["Researcher", "Analyst", "Writer", "Reviewer"].map((agent) => (
        <div
          key={agent}
          className="rounded-lg border border-border bg-surface/40 p-2 text-center transition-all duration-300 group-hover:border-border-default group-hover:bg-surface/60"
        >
          <div className="mx-auto mb-1 size-6 rounded-full bg-brand-muted transition-colors duration-300 group-hover:bg-brand-muted/80" />
          <p className="text-[10px] text-muted-foreground">{agent}</p>
        </div>
      ))}
      <div className="col-span-2 mt-1 flex items-center justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-px flex-1 bg-brand/30 transition-colors duration-300 group-hover:bg-brand/50"
          />
        ))}
      </div>
    </div>
  );
}

function WorkflowMock() {
  const steps = ["Trigger", "Retrieve", "Generate", "Approve", "Send"];
  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={cn(
              "size-6 rounded-full border text-center text-[8px] leading-6 transition-all duration-300",
              i <= 2
                ? "border-brand bg-brand-muted text-brand group-hover:shadow-[0_0_12px_rgba(245,197,24,0.2)]"
                : "border-border text-tertiary group-hover:border-border-default",
            )}
          >
            {i + 1}
          </div>
          <span className="text-[8px] text-tertiary">{step}</span>
        </div>
      ))}
    </div>
  );
}

function ResearchMock() {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-surface/40 p-3 transition-colors duration-300 group-hover:bg-surface/60">
        <p className="text-[10px] font-medium text-foreground">
          Competitive landscape — Q2
        </p>
        <p className="mt-1 text-[10px] text-tertiary">Phase: Synthesizing report</p>
      </div>
      {["Market sizing", "Feature comparison", "Pricing analysis"].map((item) => (
        <div
          key={item}
          className="flex items-center gap-2 text-[10px] text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-brand" />
          {item}
        </div>
      ))}
    </div>
  );
}

function BrowserMock() {
  return (
    <div className="space-y-2">
      <div className="rounded border border-border bg-surface/60 px-2 py-1 text-[10px] text-tertiary">
        https://portal.vendor.com/orders
      </div>
      <div className="h-24 rounded-lg border border-border bg-surface/40 p-2 transition-colors duration-300 group-hover:bg-surface/60">
        <div className="h-2 w-1/2 rounded bg-surface-hover" />
        <div className="mt-2 h-2 w-3/4 rounded bg-surface-hover" />
        <div className="mt-2 h-2 w-1/3 rounded bg-surface-hover" />
      </div>
      <p className="text-[10px] text-brand">Task: Extract order status</p>
    </div>
  );
}

function AnalyticsMock() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="flex h-full flex-col justify-end">
      <div className="flex items-end justify-between gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-brand/60 transition-all duration-300 group-hover:bg-brand/85"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: "Tasks", v: "12.4k" },
          { l: "Success", v: "98.2%" },
          { l: "Avg time", v: "1.2s" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded border border-border p-1.5 text-center transition-colors duration-300 group-hover:border-border-default"
          >
            <p className="text-[10px] font-medium text-brand">{s.v}</p>
            <p className="text-[8px] text-tertiary">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

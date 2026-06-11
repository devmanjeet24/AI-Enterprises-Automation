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
  return (
    <div
      className={cn(
        "glass-card relative aspect-[4/3] overflow-hidden p-5 transition-all duration-300 hover:border-border-strong hover:shadow-glow-sm",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.15), transparent 65%)",
        }}
      />
      <div className="relative flex h-full flex-col">
        <MockChrome />
        <div className="mt-4 flex-1">{renderVariant(variant)}</div>
      </div>
    </div>
  );
}

function MockChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3">
      <div className="size-2 rounded-full bg-destructive/60" />
      <div className="size-2 rounded-full bg-warning/60" />
      <div className="size-2 rounded-full bg-success/60" />
      <div className="ml-3 h-2 flex-1 max-w-32 rounded-full bg-surface-hover" />
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
      <div className="ml-auto max-w-[75%] rounded-xl rounded-tr-sm bg-brand-muted px-3 py-2 text-xs text-foreground">
        Summarize this support ticket and draft a reply.
      </div>
      <div className="max-w-[80%] rounded-xl rounded-tl-sm border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
        Customer reports billing discrepancy on invoice #4821. Policy: verify
        account tier before refund.
      </div>
      <div className="flex gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-tertiary">
          Source: KB-104
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-tertiary">
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
            className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-3 py-2"
          >
            <span className="text-xs text-muted-foreground">{doc}</span>
            <span className="text-[10px] text-brand">Embedded</span>
          </div>
        ),
      )}
      <div className="mt-3 rounded-lg border border-border bg-surface/50 p-3">
        <div className="h-1.5 w-full rounded-full bg-surface-hover">
          <div className="h-1.5 w-3/4 rounded-full bg-brand" />
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
          className="rounded-lg border border-border bg-surface/50 p-2 text-center"
        >
          <div className="mx-auto mb-1 size-6 rounded-full bg-brand-muted" />
          <p className="text-[10px] text-muted-foreground">{agent}</p>
        </div>
      ))}
      <div className="col-span-2 mt-1 flex items-center justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-px flex-1 bg-brand/40" />
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
              "size-6 rounded-full border text-[8px] leading-6 text-center",
              i <= 2
                ? "border-brand bg-brand-muted text-brand"
                : "border-border text-tertiary",
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
      <div className="rounded-lg border border-border bg-surface/50 p-3">
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
      <div className="rounded border border-border bg-surface/80 px-2 py-1 text-[10px] text-tertiary">
        https://portal.vendor.com/orders
      </div>
      <div className="h-24 rounded-lg border border-border bg-surface/50 p-2">
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
            className="flex-1 rounded-t bg-brand/70 transition-all duration-300 hover:bg-brand"
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
          <div key={s.l} className="rounded border border-border p-1.5 text-center">
            <p className="text-[10px] font-medium text-brand">{s.v}</p>
            <p className="text-[8px] text-tertiary">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

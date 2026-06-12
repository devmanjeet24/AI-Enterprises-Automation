export const heroVideoUrl =
  "https://yellow.ai/wp-content/uploads/2025/09/hero-video-25.mp4";

export const trustBadges = [
  "SOC 2 Type II",
  "GDPR Ready",
  "99.9% Uptime SLA",
  "Enterprise SSO",
] as const;

export const trustedByLogos = [
  "Acme Corp",
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Industries",
] as const;

export const platformCapabilities = [
  {
    title: "AI Employee Studio",
    description:
      "Design role-based AI employees with tools, guardrails, and department context.",
    icon: "users",
  },
  {
    title: "Knowledge Intelligence",
    description:
      "Ground every response in your documents with retrieval-augmented generation.",
    icon: "book",
  },
  {
    title: "Multi-Agent Teams",
    description:
      "Orchestrate specialized agents that collaborate on complex tasks.",
    icon: "network",
  },
  {
    title: "Workflow Automation",
    description:
      "Build deterministic step chains with approvals, branching, and audit trails.",
    icon: "workflow",
  },
  {
    title: "Research Hub",
    description:
      "Run structured research projects with sourced reports and exports.",
    icon: "search",
  },
  {
    title: "Browser Automation",
    description:
      "Execute web tasks with managed profiles and execution history.",
    icon: "browser",
  },
] as const;

export const analyticsStats = [
  { value: "99.9%", label: "Platform uptime" },
  { value: "10M+", label: "Tasks automated" },
  { value: "60%", label: "Faster resolution" },
  { value: "24/7", label: "Agent availability" },
] as const;

export const testimonials = [
  {
    quote:
      "We deployed AI employees across support and ops in weeks—not quarters. The governance layer gave our security team confidence from day one.",
    author: "Sarah Chen",
    role: "VP Operations",
    company: "Northwind Logistics",
  },
  {
    quote:
      "Knowledge grounding eliminated hallucinations in customer-facing workflows. Our agents cite sources and stay on policy.",
    author: "Marcus Webb",
    role: "Head of CX",
    company: "Globex Financial",
  },
  {
    quote:
      "Multi-agent collaboration handles research and browser tasks our team used to do manually. ROI was visible within the first month.",
    author: "Elena Rodriguez",
    role: "CTO",
    company: "Acme Health",
  },
] as const;

export const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "per month",
    description: "For teams exploring AI automation.",
    features: [
      "Up to 3 AI employees",
      "5 GB knowledge base",
      "Basic workflows",
      "Community support",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$499",
    period: "per month",
    description: "For growing teams scaling automation.",
    features: [
      "Unlimited AI employees",
      "50 GB knowledge base",
      "Multi-agent teams",
      "Advanced workflows",
      "Priority support",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For organizations with advanced needs.",
    features: [
      "Dedicated infrastructure",
      "Custom SLAs",
      "SSO & RBAC",
      "Audit logs & compliance",
      "Dedicated CSM",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
] as const;

export const siteConfig = {
  name: "Lumen",
  title: "AI Enterprise Automation Platform",
  description:
    "Build, deploy and govern AI employees across support, sales and operations — with grounded knowledge, deterministic workflows and enterprise-grade controls.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  links: {
    docs: "/docs",
    login: "/login",
    signup: "/signup",
    demo: "/demo",
  },
  nav: [
    { label: "Product", href: "#product" },
    { label: "Solutions", href: "#solutions" },
    { label: "Resources", href: "#resources" },
    { label: "Pricing", href: "#pricing" },
  ],
} as const;
